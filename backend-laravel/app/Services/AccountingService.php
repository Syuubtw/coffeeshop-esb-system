<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryItem;
use App\Models\Order;
use App\Models\RawMaterial;
use App\Models\StockOpname;
use App\Models\WasteLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountingService
{
    /**
     * Create double-entry journal with strict Debit == Credit balance check
     */
    public function createJournalEntry(
        string $referenceType,
        ?int $referenceId,
        ?string $referenceNumber,
        string $description,
        array $items,
        ?int $userId = null,
        ?string $entryDate = null
    ): ?JournalEntry {
        $entryDate = $entryDate ?: date('Y-m-d');
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($items as $item) {
            $totalDebit += (float) ($item['debit'] ?? 0);
            $totalCredit += (float) ($item['credit'] ?? 0);
        }

        // Float rounding tolerance (e.g. up to 1.00 due to currency tax rounding)
        $diff = round($totalDebit - $totalCredit, 2);
        if (abs($diff) > 0.001 && abs($diff) <= 1.00) {
            if ($diff > 0 && isset($items[1])) {
                $items[1]['credit'] += $diff;
                $totalCredit += $diff;
            } elseif ($diff < 0 && isset($items[0])) {
                $items[0]['debit'] += abs($diff);
                $totalDebit += abs($diff);
            }
        } elseif (abs($diff) > 1.00) {
            Log::error("Unbalanced Journal Entry Rejected: Debit={$totalDebit}, Credit={$totalCredit}", [
                'ref' => $referenceNumber,
                'items' => $items,
            ]);
            return null;
        }

        return DB::transaction(function () use (
            $referenceType,
            $referenceId,
            $referenceNumber,
            $description,
            $items,
            $userId,
            $entryDate,
            $totalDebit,
            $totalCredit
        ) {
            $entryNumber = 'JV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $entry = JournalEntry::create([
                'entry_number' => $entryNumber,
                'entry_date' => $entryDate,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'reference_number' => $referenceNumber,
                'description' => $description,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'status' => 'POSTED',
                'created_by' => $userId ?: auth()->id(),
            ]);

            foreach ($items as $item) {
                $account = ChartOfAccount::where('account_code', $item['account_code'])->first();
                if (!$account) {
                    continue;
                }

                $debit = (float) ($item['debit'] ?? 0);
                $credit = (float) ($item['credit'] ?? 0);

                JournalEntryItem::create([
                    'journal_entry_id' => $entry->id,
                    'chart_of_account_id' => $account->id,
                    'debit' => $debit,
                    'credit' => $credit,
                    'memo' => $item['memo'] ?? null,
                ]);

                // Update Account Current Balance
                if ($account->normal_balance === 'DEBIT') {
                    $account->current_balance += ($debit - $credit);
                } else {
                    $account->current_balance += ($credit - $debit);
                }
                $account->save();
            }

            return $entry;
        });
    }

    /**
     * Auto Journaling for Paid Orders (POS & QR Table)
     */
    public function recordOrderSale(Order $order): ?JournalEntry
    {
        // Avoid duplicate entry
        $existing = JournalEntry::where('reference_type', 'ORDER')
            ->where('reference_id', $order->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $order->loadMissing('items.product.recipes.rawMaterial');

        $isQr = str_contains(strtoupper($order->payment_method), 'QRIS') ||
                str_contains(strtoupper($order->payment_method), 'MIDTRANS');
        $isCash = strtoupper($order->payment_method) === 'CASH';

        // 1. Payment Receiving Account
        $paymentAccountCode = $isCash ? '1-1001' : ($isQr ? '1-1003' : '1-1002');
        $paymentAccountName = $isCash ? 'Kas Kasir' : ($isQr ? 'Rekening Kliring QRIS' : 'Bank Operasional BCA');

        $subtotal = (float) $order->subtotal;
        $tax = (float) $order->tax_amount;
        $service = (float) $order->service_charge;
        $discount = (float) ($order->discount_amount ?? 0);
        $grandTotal = (float) $order->grand_total;

        // Calculate COGS (HPP Resep BOM)
        $totalCogs = 0;
        foreach ($order->items as $item) {
            if ($item->product && $item->product->recipes) {
                foreach ($item->product->recipes as $rcp) {
                    $costPerUnit = $rcp->rawMaterial->avg_cost_per_unit ?? 0;
                    $totalCogs += ($rcp->qty_needed * $item->qty * $costPerUnit);
                }
            }
        }
        $totalCogs = round($totalCogs, 2);

        $items = [
            // DEBIT: Kas / Bank / QRIS
            [
                'account_code' => $paymentAccountCode,
                'debit' => $grandTotal,
                'credit' => 0,
                'memo' => "Penerimaan bayar order #{$order->order_number} via {$order->payment_method}",
            ],
            // KREDIT: Pendapatan Penjualan Minuman & Makanan
            [
                'account_code' => '4-4001',
                'debit' => 0,
                'credit' => $subtotal,
                'memo' => "Penjualan menu order #{$order->order_number}",
            ],
        ];

        // DEBIT: Potongan Diskon Penjualan (Contra-Revenue)
        if ($discount > 0) {
            $items[] = [
                'account_code' => '4-4004',
                'debit' => $discount,
                'credit' => 0,
                'memo' => "Diskon promosi order #{$order->order_number}",
            ];
        }

        // KREDIT: Titipan Pajak Resto (10%)
        if ($tax > 0) {
            $items[] = [
                'account_code' => '2-2002',
                'debit' => 0,
                'credit' => $tax,
                'memo' => "Titipan Pajak Restoran 10% #{$order->order_number}",
            ];
        }

        // KREDIT: Biaya Layanan Toko (5%)
        if ($service > 0) {
            $items[] = [
                'account_code' => '4-4003',
                'debit' => 0,
                'credit' => $service,
                'memo' => "Biaya Layanan Toko 5% #{$order->order_number}",
            ];
        }

        // DEBIT & KREDIT: Modal Bahan Terpakai & Pengurangan Persediaan
        if ($totalCogs > 0) {
            $items[] = [
                'account_code' => '5-5001',
                'debit' => $totalCogs,
                'credit' => 0,
                'memo' => "Modal Bahan Baku Terpakai #{$order->order_number}",
            ];
            $items[] = [
                'account_code' => '1-1010',
                'debit' => 0,
                'credit' => $totalCogs,
                'memo' => "Pengurangan Stok Bahan Gudang #{$order->order_number}",
            ];
        }

        return $this->createJournalEntry(
            'ORDER',
            $order->id,
            $order->order_number,
            "Penjualan Kasir/QR Meja #{$order->order_number} ({$order->customer_name})",
            $items,
            null,
            $order->created_at ? $order->created_at->format('Y-m-d') : null
        );
    }

    /**
     * Auto Journaling for Stock In (Purchase Inbound)
     */
    public function recordStockIn(RawMaterial $material, float $qty, float $totalCost, string $source = 'CASH'): ?JournalEntry
    {
        $creditAccount = $source === 'CASH' ? '1-1001' : '1-1002';

        $items = [
            [
                'account_code' => '1-1010',
                'debit' => $totalCost,
                'credit' => 0,
                'memo' => "Inbound stok bahan baku: {$qty} {$material->unit} {$material->name}",
            ],
            [
                'account_code' => $creditAccount,
                'debit' => 0,
                'credit' => $totalCost,
                'memo' => "Pembayaran pembelian bahan baku {$material->name}",
            ],
        ];

        return $this->createJournalEntry(
            'STOCK_IN',
            $material->id,
            $material->sku,
            "Penerimaan Pembelian Bahan Baku: {$material->name} ({$qty} {$material->unit})",
            $items
        );
    }

    /**
     * Auto Journaling for Approved Waste
     */
    public function recordWaste(WasteLog $waste, float $totalCost): ?JournalEntry
    {
        $items = [
            [
                'account_code' => '6-6001',
                'debit' => $totalCost,
                'credit' => 0,
                'memo' => "Biaya bahan tumpah/rusak: {$waste->qty} {$waste->rawMaterial->unit} ({$waste->reason})",
            ],
            [
                'account_code' => '1-1010',
                'debit' => 0,
                'credit' => $totalCost,
                'memo' => "Pengurangan stok bahan gudang akibat rusak #{$waste->id}",
            ],
        ];

        return $this->createJournalEntry(
            'WASTE',
            $waste->id,
            "WASTE-{$waste->id}",
            "Pencatatan Bahan Rusak / Tumpah: {$waste->rawMaterial->name} ({$waste->reason})",
            $items
        );
    }

    /**
     * Auto Journaling for Stock Opname Variance
     */
    public function recordStockOpnameVariance(StockOpname $opname): ?JournalEntry
    {
        $varianceCost = (float) $opname->total_variance_cost;
        if (abs($varianceCost) < 0.01) {
            return null;
        }

        if ($varianceCost < 0) {
            // Selisih Fisik Lebih Kecil dari Sistem (Kehilangan / Shrinkage)
            $lossAmount = abs($varianceCost);
            $items = [
                [
                    'account_code' => '6-6004',
                    'debit' => $lossAmount,
                    'credit' => 0,
                    'memo' => "Kerugian selisih kurang cek fisik gudang {$opname->opname_number}",
                ],
                [
                    'account_code' => '1-1010',
                    'debit' => 0,
                    'credit' => $lossAmount,
                    'memo' => "Penyesuaian stok berkurang di gudang {$opname->opname_number}",
                ],
            ];
        } else {
            // Selisih Fisik Lebih Besar (Surplus)
            $surplusAmount = $varianceCost;
            $items = [
                [
                    'account_code' => '1-1010',
                    'debit' => $surplusAmount,
                    'credit' => 0,
                    'memo' => "Penyesuaian surplus persediaan fisik {$opname->opname_number}",
                ],
                [
                    'account_code' => '3-3002',
                    'debit' => 0,
                    'credit' => $surplusAmount,
                    'memo' => "Penyesuaian laba persediaan opname {$opname->opname_number}",
                ],
            ];
        }

        return $this->createJournalEntry(
            'STOCK_OPNAME',
            $opname->id,
            $opname->opname_number,
            "Penyesuaian Selisih Stock Opname {$opname->opname_number}",
            $items
        );
    }

    /**
     * Backfill / Sync past paid orders that have no journal entries yet
     */
    public function syncPastPaidOrders(): int
    {
        $orders = Order::where('payment_status', 'PAID')
            ->orderBy('created_at', 'asc')
            ->get();

        $count = 0;
        foreach ($orders as $order) {
            $existing = JournalEntry::where('reference_type', 'ORDER')
                ->where('reference_id', $order->id)
                ->exists();

            if (!$existing) {
                $entry = $this->recordOrderSale($order);
                if ($entry) {
                    $count++;
                }
            }
        }
        return $count;
    }
}
