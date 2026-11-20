<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group(
    name: '11. Owner (Akuntansi & Laba Rugi)',
    description: 'Laporan keuangan back-office: bagan akun standar (COA), jurnal umum otomatis berbasis ESB, neraca saldo, dan laporan laba rugi (P&L).',
    weight: 11
)]
class AccountingController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Bagan Akun Standar (COA) Beserta Saldo Berjalan
     */
    public function getChartOfAccounts(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::orderBy('account_code')->get();

        $grouped = [
            'ASSET' => $accounts->where('type', 'ASSET')->values(),
            'LIABILITY' => $accounts->where('type', 'LIABILITY')->values(),
            'EQUITY' => $accounts->where('type', 'EQUITY')->values(),
            'REVENUE' => $accounts->where('type', 'REVENUE')->values(),
            'EXPENSE' => $accounts->where('type', 'EXPENSE')->values(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'all' => $accounts,
                'grouped' => $grouped,
            ],
        ]);
    }

    /**
     * Daftar Jurnal Umum & Buku Besar Otomatis ESB
     */
    public function getJournalEntries(Request $request): JsonResponse
    {
        // Auto-sync past paid orders on first access if journals are empty
        if (JournalEntry::count() === 0) {
            $this->accountingService->syncPastPaidOrders();
        }

        $query = JournalEntry::with(['items.account', 'creator'])
            ->orderBy('entry_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('entry_date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('entry_number', 'ilike', "%{$s}%")
                  ->orWhere('description', 'ilike', "%{$s}%")
                  ->orWhere('reference_number', 'ilike', "%{$s}%");
            });
        }

        $entries = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $entries,
        ]);
    }

    /**
     * Laporan Laba Rugi Komprehensif (Profit & Loss)
     */
    public function getProfitLoss(Request $request): JsonResponse
    {
        if (JournalEntry::count() === 0) {
            $this->accountingService->syncPastPaidOrders();
        }

        $selectedYear = (int) $request->input('year', \Carbon\Carbon::now()->year);
        $selectedMonth = (int) $request->input('month', \Carbon\Carbon::now()->month);
        $monthStart = \Carbon\Carbon::create($selectedYear, $selectedMonth, 1)->startOfMonth();
        $monthEnd = \Carbon\Carbon::create($selectedYear, $selectedMonth, 1)->endOfMonth();
        $periodLabel = $monthStart->translatedFormat('F Y');

        $accounts = ChartOfAccount::whereIn('type', ['REVENUE', 'EXPENSE'])->get();

        if ($request->filled('month') && $request->filled('year')) {
            $journalItems = \App\Models\JournalEntryItem::whereHas('journalEntry', function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('entry_date', [$monthStart->toDateString(), $monthEnd->toDateString()]);
            })->get();

            if ($journalItems->isNotEmpty()) {
                $accounts = $accounts->map(function ($acc) use ($journalItems) {
                    $items = $journalItems->where('chart_of_account_id', $acc->id);
                    $totalDebit = (float) $items->sum('debit');
                    $totalCredit = (float) $items->sum('credit');
                    $balance = $acc->normal_balance === 'DEBIT' ? ($totalDebit - $totalCredit) : ($totalCredit - $totalDebit);
                    $clone = clone $acc;
                    $clone->current_balance = max(0, $balance);
                    return $clone;
                });
            }
        }

        // Revenue Breakdown: Gross Sales (Credit) minus Discounts (Debit)
        $grossSales = (float) $accounts->where('type', 'REVENUE')->where('normal_balance', 'CREDIT')->sum('current_balance');
        $discounts = (float) $accounts->where('type', 'REVENUE')->where('normal_balance', 'DEBIT')->sum('current_balance');
        $totalRevenue = max(0, $grossSales - $discounts);

        // COGS Breakdown
        $cogsAccounts = $accounts->where('category', 'COGS');
        $totalCogs = (float) $cogsAccounts->sum('current_balance');

        // Gross Profit
        $grossProfit = $totalRevenue - $totalCogs;
        $grossMarginPercent = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 1) : 0;

        // Operating Expenses Breakdown
        $opexAccounts = $accounts->where('type', 'EXPENSE')->where('category', '!=', 'COGS');
        $totalOpex = (float) $opexAccounts->sum('current_balance');

        // Net Operating Profit
        $netProfit = $grossProfit - $totalOpex;
        $netMarginPercent = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => $request->filled('month') ? $periodLabel : 'Bulan Berjalan',
                'revenue' => [
                    'accounts' => $accounts->where('type', 'REVENUE')->values(),
                    'gross_sales' => $grossSales,
                    'discounts' => $discounts,
                    'total' => $totalRevenue,
                ],
                'cogs' => [
                    'accounts' => $cogsAccounts->values(),
                    'total' => $totalCogs,
                ],
                'gross_profit' => [
                    'amount' => $grossProfit,
                    'margin_percent' => $grossMarginPercent,
                ],
                'operating_expenses' => [
                    'accounts' => $opexAccounts->values(),
                    'total' => $totalOpex,
                ],
                'net_profit' => [
                    'amount' => $netProfit,
                    'margin_percent' => $netMarginPercent,
                ],
            ],
        ]);
    }

    /**
     * Laporan Posisi Keuangan (Neraca / Balance Sheet)
     */
    public function getBalanceSheet(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::whereIn('type', ['ASSET', 'LIABILITY', 'EQUITY'])->get();

        // Calculate Net Income to add to Equity (Retained Earnings)
        $incomeAccounts = ChartOfAccount::whereIn('type', ['REVENUE', 'EXPENSE'])->get();
        $totalRevenue = (float) $incomeAccounts->where('type', 'REVENUE')->sum('current_balance');
        $totalExpense = (float) $incomeAccounts->where('type', 'EXPENSE')->sum('current_balance');
        $currentPeriodNetIncome = $totalRevenue - $totalExpense;

        $assets = $accounts->where('type', 'ASSET');
        $totalAssets = (float) $assets->sum('current_balance');

        $liabilities = $accounts->where('type', 'LIABILITY');
        $totalLiabilities = (float) $liabilities->sum('current_balance');

        $equity = $accounts->where('type', 'EQUITY');
        $baseEquity = (float) $equity->sum('current_balance');
        $totalEquity = $baseEquity + $currentPeriodNetIncome;

        $isBalanced = abs($totalAssets - ($totalLiabilities + $totalEquity)) < 1.0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'assets' => [
                    'accounts' => $assets->values(),
                    'total' => $totalAssets,
                ],
                'liabilities' => [
                    'accounts' => $liabilities->values(),
                    'total' => $totalLiabilities,
                ],
                'equity' => [
                    'accounts' => $equity->values(),
                    'current_period_net_income' => $currentPeriodNetIncome,
                    'total' => $totalEquity,
                ],
                'balance_check' => [
                    'total_assets' => $totalAssets,
                    'total_liabilities_and_equity' => $totalLiabilities + $totalEquity,
                    'is_balanced' => $isBalanced,
                ],
            ],
        ]);
    }

    /**
     * Neraca Saldo Akun (Trial Balance)
     */
    public function getTrialBalance(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::orderBy('account_code')->get();

        $rows = [];
        $grandDebit = 0;
        $grandCredit = 0;

        foreach ($accounts as $acc) {
            $debit = $acc->normal_balance === 'DEBIT' ? (float) $acc->current_balance : 0;
            $credit = $acc->normal_balance === 'CREDIT' ? (float) $acc->current_balance : 0;

            $grandDebit += $debit;
            $grandCredit += $credit;

            $rows[] = [
                'id' => $acc->id,
                'account_code' => $acc->account_code,
                'account_name' => $acc->account_name,
                'type' => $acc->type,
                'debit' => $debit,
                'credit' => $credit,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'accounts' => $rows,
                'grand_total_debit' => $grandDebit,
                'grand_total_credit' => $grandCredit,
                'is_balanced' => abs($grandDebit - $grandCredit) < 1.0,
            ],
        ]);
    }

    /**
     * Input Entri Jurnal Penyesuaian Manual (Manual Journal)
     */
    public function storeManualJournal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entry_date' => 'required|date',
            'description' => 'required|string|max:255',
            'items' => 'required|array|min:2',
            'items.*.account_code' => 'required|exists:chart_of_accounts,account_code',
            'items.*.debit' => 'required|numeric|min:0',
            'items.*.credit' => 'required|numeric|min:0',
            'items.*.memo' => 'nullable|string|max:255',
        ]);

        $entry = $this->accountingService->createJournalEntry(
            'MANUAL',
            null,
            'MANUAL-' . date('Ymd'),
            $validated['description'],
            $validated['items'],
            auth()->id(),
            $validated['entry_date']
        );

        if (!$entry) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jurnal tidak seimbang! Total Debit harus sama persis dengan Total Kredit.',
            ], 422);
        }

        AuditService::log(
            'JOURNAL_CREATED',
            'JournalEntry',
            $entry->id,
            "Posting Jurnal Penyesuaian Manual {$entry->entry_number}: {$entry->description}",
            null,
            $validated
        );

        return response()->json([
            'status' => 'success',
            'message' => "Jurnal {$entry->entry_number} berhasil diposting.",
            'data' => $entry->load('items.account'),
        ]);
    }
}
