<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ASSETS (1-XXXX)
            [
                'account_code' => '1-1001',
                'account_name' => 'Uang Kas di Laci Kasir',
                'type' => 'ASSET',
                'category' => 'CASH_BANK',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 1500000,
                'current_balance' => 1500000,
                'description' => 'Uang tunai di laci kasir untuk modal awal kembalian dan transaksi tunai.',
            ],
            [
                'account_code' => '1-1002',
                'account_name' => 'Rekening Bank Operasional Toko',
                'type' => 'ASSET',
                'category' => 'CASH_BANK',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 25000000,
                'current_balance' => 25000000,
                'description' => 'Rekening bank operasional utama untuk pembayaran ke pemasok dan penampungan modal.',
            ],
            [
                'account_code' => '1-1003',
                'account_name' => 'Penerimaan Pembayaran QRIS',
                'type' => 'ASSET',
                'category' => 'CASH_BANK',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Uang hasil pembayaran non-tunai QRIS sebelum ditransfer ke rekening bank.',
            ],
            [
                'account_code' => '1-1010',
                'account_name' => 'Stok Bahan Baku di Gudang',
                'type' => 'ASSET',
                'category' => 'INVENTORY',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 18500000,
                'current_balance' => 18500000,
                'description' => 'Nilai persediaan fisik biji kopi, susu, sirup, gelas cup, dan bahan lainnya di gudang.',
            ],

            // LIABILITIES (2-XXXX)
            [
                'account_code' => '2-2001',
                'account_name' => 'Tagihan ke Pemasok Bahan',
                'type' => 'LIABILITY',
                'category' => 'CURRENT_LIABILITY',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Kewajiban pembayaran pembelian bahan baku yang belum lunas ke pemasok.',
            ],
            [
                'account_code' => '2-2002',
                'account_name' => 'Titipan Pajak Restoran (10%)',
                'type' => 'LIABILITY',
                'category' => 'CURRENT_LIABILITY',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Titipan pajak restoran 10% dari pelanggan yang disetorkan ke kas daerah.',
            ],
            [
                'account_code' => '2-2003',
                'account_name' => 'Gaji Karyawan yang Belum Dibayar',
                'type' => 'LIABILITY',
                'category' => 'CURRENT_LIABILITY',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Gaji karyawan bulan berjalan yang belum dibayarkan.',
            ],

            // EQUITY (3-XXXX)
            [
                'account_code' => '3-3001',
                'account_name' => 'Modal Awal Pemilik Toko',
                'type' => 'EQUITY',
                'category' => 'EQUITY',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 45000000,
                'current_balance' => 45000000,
                'description' => 'Modal investasi awal pendirian kedai kopi.',
            ],
            [
                'account_code' => '3-3002',
                'account_name' => 'Simpanan Keuntungan Usaha',
                'type' => 'EQUITY',
                'category' => 'EQUITY',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Akumulasi keuntungan bersih usaha yang disimpan untuk kas toko.',
            ],

            // REVENUE (4-XXXX)
            [
                'account_code' => '4-4001',
                'account_name' => 'Penjualan Minuman & Kopi',
                'type' => 'REVENUE',
                'category' => 'SALES',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Total uang masuk dari penjualan semua menu minuman dan kopi.',
            ],
            [
                'account_code' => '4-4002',
                'account_name' => 'Penjualan Makanan & Roti',
                'type' => 'REVENUE',
                'category' => 'SALES',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Total uang masuk dari penjualan croissant, toast, dan camilan.',
            ],
            [
                'account_code' => '4-4003',
                'account_name' => 'Biaya Layanan Toko (5%)',
                'type' => 'REVENUE',
                'category' => 'SALES',
                'normal_balance' => 'CREDIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Biaya layanan minum di tempat yang dibayar oleh pelanggan.',
            ],
            [
                'account_code' => '4-4004',
                'account_name' => 'Potongan Diskon & Promo',
                'type' => 'REVENUE',
                'category' => 'SALES',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Potongan harga diskon atau promosi yang diberikan kepada pelanggan.',
            ],

            // COGS / HPP (5-XXXX)
            [
                'account_code' => '5-5001',
                'account_name' => 'Modal Bahan Baku Terpakai (Kopi, Susu, Sirup, Cup)',
                'type' => 'EXPENSE',
                'category' => 'COGS',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Biaya modal bahan baku yang langsung terpakai saat pesanan dibuat.',
            ],

            // OPERATING EXPENSES (6-XXXX)
            [
                'account_code' => '6-6001',
                'account_name' => 'Biaya Kerusakan / Bahan Tumpah & Rusak',
                'type' => 'EXPENSE',
                'category' => 'OPERATING_EXPENSE',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Kerugian akibat bahan baku tumpah, susu basi, atau kesalahan racik.',
            ],
            [
                'account_code' => '6-6002',
                'account_name' => 'Biaya Gaji & Upah Karyawan',
                'type' => 'EXPENSE',
                'category' => 'OPERATING_EXPENSE',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Gaji bulanan dan upah kerja untuk tim barista dan kasir.',
            ],
            [
                'account_code' => '6-6003',
                'account_name' => 'Biaya Potongan Admin QRIS',
                'type' => 'EXPENSE',
                'category' => 'OPERATING_EXPENSE',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Potongan biaya transaksi admin QRIS.',
            ],
            [
                'account_code' => '6-6004',
                'account_name' => 'Kerugian Selisih Barang Hilang / Berkurang',
                'type' => 'EXPENSE',
                'category' => 'OPERATING_EXPENSE',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Selisih barang yang berkurang saat pengecekan fisik di gudang.',
            ],
            [
                'account_code' => '6-6005',
                'account_name' => 'Biaya Listrik, Air & Internet (Wi-Fi)',
                'type' => 'EXPENSE',
                'category' => 'OPERATING_EXPENSE',
                'normal_balance' => 'DEBIT',
                'initial_balance' => 0,
                'current_balance' => 0,
                'description' => 'Biaya bulanan untuk operasional mesin kopi, AC, lampu, air, dan Wi-Fi.',
            ],
        ];

        foreach ($accounts as $acc) {
            ChartOfAccount::updateOrCreate(
                ['account_code' => $acc['account_code']],
                $acc
            );
        }
    }
}
