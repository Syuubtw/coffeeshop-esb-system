# CoffeeShop ESB & POS System
> **Sistem Point of Sale (POS) & Enterprise Service Bus (ESB) Terintegrasi Berbasis Multi-Role untuk Bisnis Food & Beverage (F&B)**

Repository ini berisi implementasi lengkap sistem ERP & POS modern untuk operasional coffee shop terintegrasi (*Mie Gacoan / ESB style*). Dokumen arsitektur lengkap dapat dibaca pada [BLUEPRINT.md](./BLUEPRINT.md).

---

## 🚀 Fitur Utama & Modul Bisnis

1. **Self-Service QR Meja Pelanggan**: Pemesanan mandiri tanpa kasir via QR code nomor meja dengan pelacakan status realtime.
2. **Kasir POS & Shift Laci Kas**: Buka/tutup shift kasir, pencatatan modal awal kasir, rekonsiliasi uang fisik laci, dan pelunasan bayar tunai/nontunai.
3. **Barista Kitchen Display System (KDS)**: Antrean dapur urut otomatis (*Auto-FIFO*), monitoring waktu racik, dan tombol darurat menu habis (*86 / Sold-Out*).
4. **Resep BOM & Pemotongan Stok Otomatis**: Setiap menu terjual otomatis memotong gramasi bahan baku di gudang secara akurat.
5. **Pengadaan Bahan Baku (Procurement PO)**: Alur pengajuan Purchase Order dari gudang, approval Store Manager, penerimaan fisik barang, dan perhitungan *Moving Average Cost*.
6. **Audit & Anti-Fraud**: Pemeriksaan fisik *Stock Opname* vs sistem, rekonsiliasi kas laci kasir (selisih lebih/kurang), dan audit pembatalan pesanan (*Void*).
7. **HR & Presensi Anti-Titip Absen**: Presensi mandiri via smartphone dengan validasi *Geofencing GPS*, penguncian perangkat (*Device Binding* 1 HP 1 akun), serta tablet kiosk outlet.
8. **Akuntansi Terpadu (General Ledger & Laba Rugi)**: Pencatatan jurnal umum otomatis dari transaksi POS dan pengadaan bahan, Bagan Akun Standar (COA), Neraca Saldo, dan Laporan Laba Rugi (*P&L*).
9. **Dashboard Eksekutif**: Metrik omset kotor/bersih, HPP aktual, Average Order Value (AOV), dan grafik tren performa bulanan.
10. **Dokumentasi REST API Interaktif**: Menggunakan Dedoc Scramble di `/docs/api` dengan seluruh endpoint dikelompokkan ke dalam 12 peran fungsional berbahasa Indonesia.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
* **Backend**: Laravel 11, PHP 8.2+, RESTful API, Laravel Sanctum (Bearer Token)
* **Manajemen Akses**: Spatie Laravel Permission (RBAC: `super_admin`, `store_manager`, `cashier`, `barista`, `warehouse_admin`)
* **Database**: PostgreSQL / MySQL
* **Dokumentasi API**: Dedoc Scramble (OpenAPI 3.1)
* **Payment Gateway**: Midtrans Sandbox (Snap & Webhook Simulator)

---

## 👥 Matriks Hak Akses & Kredensial Pengujian

| Peran (Role) | Email Login | Password | Akses Layar Utama |
| :--- | :--- | :--- | :--- |
| **Super Admin (Owner)** | `admin@coffeeshop.test` | `password` | Owner Dashboard (Laba Rugi, Neraca, Jurnal, Omset) |
| **Store Manager** | `manager@coffeeshop.test` | `password` | Manager Dashboard (Menu, Resep BOM, Approval PO, Audit) |
| **Admin Gudang** | `warehouse@coffeeshop.test` | `password` | Warehouse Dashboard (Stok Bahan, Kartu Stok, PO) |
| **Kasir** | `cashier@coffeeshop.test` | `password` | Cashier POS (Shift Laci Kas, Transaksi Kasir Langsung) |
| **Barista** | `barista@coffeeshop.test` | `password` | Barista KDS (Layar Antrean Dapur Auto-FIFO) |

---

## 📁 Peta Struktur File Proyek

```text
coffeeshop-esb-system/
├── BLUEPRINT.md                        # Blueprint arsitektur teknis lengkap sistem
├── README.md                           # Dokumentasi umum repositori
├── frontend-react/                     # Aplikasi Frontend React (SPA)
│   └── src/components/
│       ├── OwnerDashboard.tsx          # Layar Pemilik / Statistik & Laba Rugi
│       ├── ManagerDashboard.tsx        # Layar Store Manager & Resep BOM
│       ├── WarehouseDashboard.tsx      # Layar Gudang & PO Pengadaan
│       ├── CashierPos.tsx              # Layar Kasir POS
│       ├── BaristaKds.tsx              # Layar Dapur Barista (KDS)
│       ├── AttendanceKiosk.tsx         # Layar Kiosk Presensi Toko
│       ├── StaffMobileAttendance.tsx   # Layar Presensi Mandiri di HP Karyawan
│       ├── CustomerOrder.tsx           # Layar Pemesanan Meja Pelanggan
│       └── LoginPage.tsx               # Layar Login Staf Multi-Role
└── backend-laravel/                    # Backend API Laravel
    └── app/Http/Controllers/Api/
        ├── AuthController.php          # 01. Autentikasi Staf (Login & Sesi)
        ├── QrOrderController.php        # 02. Pelanggan (Self-Service QR Meja)
        ├── PaymentController.php       # 03. Pembayaran & Gateway (Midtrans)
        ├── PosController.php           # 04. Kasir (POS & Kas Laci)
        ├── KdsController.php           # 05. Barista (KDS Kitchen Display System)
        ├── InventoryController.php     # 06. Gudang (Stok Bahan & Kartu Stok)
        ├── PurchaseOrderController.php # 07. Gudang (Pengadaan Bahan / PO)
        ├── ProductController.php       # 08. Manajer (Katalog Menu & Resep BOM)
        ├── AuditController.php         # 09. Manajer (Audit Opname, Void & Anti-Fraud)
        ├── HrPayrollController.php     # 10. HR & Presensi (Absensi Karyawan & Kiosk)
        ├── AccountingController.php    # 11. Owner (Akuntansi & Laba Rugi)
        └── DashboardController.php     # 12. Owner (Statistik Omset & Metrik)
```

---

## ⚡ Panduan Instalasi Lokal

### 1. Jalankan Backend (Laravel)
```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*Dokumentasi API:* `http://localhost:8000/docs/api`

### 2. Jalankan Frontend (React)
```bash
cd frontend-react
npm install
npm run dev
```
*Aplikasi Frontend:* `http://localhost:5173`
