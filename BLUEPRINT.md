# BLUEPRINT & ARSITEKTUR SISTEM
# CoffeeShop ESB & POS System
> **Sistem Point of Sale (POS) & Enterprise Service Bus (ESB) Terintegrasi Berbasis Multi-Role untuk Bisnis Food & Beverage (F&B)**

---

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Visi Sistem
**CoffeeShop ESB** adalah sistem terpadu (*Enterprise Resource Planning* skala F&B) yang menggabungkan operasional **Front-Office** (Kasir POS dan Pemesanan Meja Mandiri oleh Pelanggan) dengan **Back-Office** (Layar Dapur Barista KDS, Manajemen Stok Bahan Baku Gudang, Pengadaan PO, Presensi Karyawan, hingga Akuntansi Laba Rugi Otomatis).

### 1.2 Masalah Nyata di Industri F&B
Pada coffee shop konvensional, sering terjadi **silo data**:
1. Kasir mencatat penjualan, namun persediaan bahan baku di gudang tidak otomatis berkurang.
2. Dapur / barista tidak memiliki antrean urut (*FIFO*), menyebabkan pesanan salah racik atau terlewat.
3. Selisih fisik barang di gudang dengan catatan kasir sering bocor (*fraud* / kebocoran bahan) tanpa audit trail.
4. Laporan laba rugi dan pembukuan baru dihitung secara manual di akhir bulan, memakan waktu lama dan rentan manipulasi.

### 1.3 Solusi: Konsep Enterprise Service Bus (ESB)
Sistem ini mengadopsi prinsip **Enterprise Service Bus (ESB)**:
* Setiap kali terjadi peristiwa bisnis (contoh: pesanan kasir dibayar), sebuah pesan (*event*) diproses secara otomatis oleh sistem untuk memicu tindakan rantai:
  1. **Memotong persediaan bahan baku** di gudang sesuai formula resep (*Bill of Materials* - BOM).
  2. **Meneruskan tiket pesanan** ke layar KDS barista dapur secara *real-time*.
  3. **Mencatat mutasi stok** berjenis `OUT_SALE` ke kartu stok.
  4. **Menerbitkan jurnal umum akuntansi otomatis** (Debit: Kas/Bank, Kredit: Pendapatan Penjualan) ke Bagan Akun Standar (COA).
  5. **Memperbarui metrik omset dan HPP aktual** pada Dashboard Eksekutif Pemilik Toko.

---

## 2. Arsitektur Teknologi (Tech Stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / FRONTEND                             │
│                  React 18 + TypeScript + Vite + Tailwind CSS            │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐  │
│  │   Customer Order QR   │    Cashier POS UI    │   Barista KDS UI   │  │
│  ├───────────────────────┼──────────────────────┼────────────────────┤  │
│  │  Warehouse Dashboard  │  Manager Dashboard   │  Owner Dashboard   │  │
│  └───────────────────────┴──────────────────────┴────────────────────┘  │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ HTTP REST JSON / Bearer Token
┌────────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND SERVICE (API GATEWAY)                     │
│                        Laravel 11 + PHP 8.2+                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Auth & RBAC (Sanctum + Spatie Permission)                       │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   Enterprise Controllers (POS, KDS, Inventory, PO, Audit, HR)     │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   ESB Service Layer (AccountingService, AuditService)             │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   OpenAPI Documentation Engine (Dedoc Scramble)                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
                   ▼                                   ▼
        ┌─────────────────────┐             ┌─────────────────────┐
        │  DATABASE STORAGE   │             │   EXTERNAL SERVICES │
        │     PostgreSQL      │             │  Midtrans Sandbox   │
        │  Relational Storage │             │   Payment Gateway   │
        └─────────────────────┘             └─────────────────────┘
```

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) | Single Page Application (SPA), aman dengan *strict typing*. |
| **Bundler & Tooling** | Vite 8 + Tailwind CSS | Kompilasi ultra-cepat, styling responsif modern. |
| **Backend Framework** | Laravel 11 (PHP 8.2+) | RESTful API, ORM Eloquent, database transaction ACID. |
| **Otentikasi & Keamanan** | Laravel Sanctum | Token Bearer API untuk sesi staf multi-device. |
| **Manajemen Hak Akses** | Spatie Laravel Permission | Role-Based Access Control (RBAC). |
| **Database Engine** | PostgreSQL / MySQL | Relasional, relasi foreign key integritas data ketat. |
| **Dokumentasi API** | Dedoc Scramble | Dokumentasi OpenAPI / Swagger otomatis di `/docs/api`. |
| **Payment Gateway** | Midtrans Core API / Snap | Integrasi nontunai QRIS, GoPay, dan simulator sandbox. |

---

## 3. Matriks Hak Akses & Peran Pengguna (RBAC)

Sistem membedakan akses secara ketat berdasarkan peran (*role*) operasional:

| Role | Kode Sistem | Cakupan Tanggung Jawab & Menu Layar |
| :--- | :--- | :--- |
| **Pemilik Toko** | `super_admin` | Akses penuh 100%: Laporan Laba Rugi, Neraca Keuangan, Bagan Akun COA, Jurnal Umum, Dashboard Omset Eksekutif, dan Jejak Audit. |
| **Store Manager** | `store_manager` | Manajemen operasional toko: Master Produk & Resep BOM, Approval PO Pengadaan, Approval Bahan Rusak (*Waste*), Approval Stock Opname, dan Rekap Presensi Karyawan. |
| **Admin Gudang** | `warehouse_admin` | Manajemen fisik persediaan: Stok Masuk Manual (*Inbound*), Input Hasil Opname Fisik, Ajukan Laporan Waste, Ajukan PO ke Supplier, dan Terima Fisik Barang. |
| **Kasir** | `cashier` | Operasional *Front-Office*: Buka/Tutup Kas Laci (*Cashier Shift*), Catat Pesanan Dine-in / Takeaway, Pelunasan Kas / QRIS, dan Presensi Mandiri. |
| **Barista** | `barista` | Operasional Dapur: Layar KDS antrean urut FIFO, Ubah status peracikan (Sedang Diracik ➔ Siap Saji), Toggle status menu habis darurat (*Sold-Out*). |
| **Karyawan** | `employee` | Presensi mandiri melalui scan QR poster toko (dengan penguncian device binding anti-titip absen) dan kiosk tablet toko. |
| **Pelanggan** | *Public / Guest* | Akses pemesanan mandiri melalui scan QR code nomor meja tanpa perlu login (*Mie Gacoan flow*). |

---

## 4. Alur Proses Bisnis Terintegrasi (Core Workflows)

### 4.1 Alur Pemesanan Meja Mandiri Pelanggan (QR Table Flow)
```
[Tamu Duduk di Meja] 
       │
       ▼
[Scan QR Code Meja] ➔ [GET /api/qr/table/{token}] (Verifikasi Meja & Muat Menu Aktif)
       │
       ▼
[Pilih Menu & Modifiers] (Contoh: Extra Shot, Less Sugar)
       │
       ▼
[Kirim Pesanan] ➔ [POST /api/qr/order]
       │
       ├─► 1. Status Meja berubah menjadi OCCUPIED
       ├─► 2. Potong Stok Bahan Baku di Gudang sesuai Resep BOM (FIFO)
       ├─► 3. Catat Mutasi Stok OUT_SALE
       ├─► 4. Tiket pesanan otomatis muncul di Layar KDS Barista
       └─► 5. Jika memilih QRIS Midtrans ➔ Diterbitkan Snap Token Pembayaran
```

### 4.2 Alur Dapur Barista (Kitchen Display System - Auto-FIFO)
```
[Pesanan Masuk dari POS / QR Meja]
       │
       ▼
[Layar KDS Barista / KdsScreen] (GET /api/kds/queue)
Urut berdasarkan waktu masuk pesanan terlama (FIFO)
       │
       ▼
[Barista Klik "Mulai Racik"] ➔ [PATCH /api/kds/orders/{id}/status] (PREPARING)
       │
       ▼
[Barista Klik "Siap Saji"] ➔ (READY)
       │
       ▼
[Pesanan Diantar ke Meja / Diambil Tamu] ➔ (SERVED / COMPLETED)
       │
       └─► Meja makan otomatis kembali berstatus AVAILABLE
```

### 4.3 Alur Pengadaan Bahan Baku & Akuntansi Terpadu
```
[Stok Bahan Gudang Menipis] (Indikator Merah < Min Stock Alert)
       │
       ▼
[Admin Gudang Ajukan PO] ➔ [POST /api/procurement/orders] (Status: PENDING_APPROVAL)
       │
       ▼
[Store Manager Review & Setujui] ➔ [PATCH /api/procurement/orders/{id}/approve]
       │
       ▼
[Supplier Mengirim Barang ke Outlet]
       │
       ▼
[Admin Gudang Konfirmasi Barang Datang] ➔ [POST /api/procurement/orders/{id}/receive]
       │
       ├─► 1. Stok Gudang Otomatis Bertambah
       ├─► 2. Sistem Menghitung Ulang Moving Average Cost (HPP Rata-rata per Unit)
       ├─► 3. Catat Log Mutasi Stok IN_PURCHASE
       └─► 4. Menerbitkan Jurnal Akuntansi Otomatis:
              Debit: Persediaan Bahan Baku
              Kredit: Kas / Hutang Usaha
```

### 4.4 Alur Anti-Fraud Presensi Karyawan (Geofencing & Device Binding)
```
[Karyawan Tiba di Outlet]
       │
       ▼
[Scan QR Poster Outlet dengan HP Sendiri]
       │
       ├─► 1. Cek Geofencing GPS (Radius toleransi meter terhadap titik koordinat toko)
       ├─► 2. Cek Device Binding (UUID Browser HP terkunci pada akun karyawan pertama kali)
       │      Jika HP dipinjam teman ➔ Ditolak: "Device tidak cocok / terindikasi titip absen"
       └─► 3. Cek Jam Kerja Shift ➔ Catat status Hadir Tepat Waktu atau Terlambat (menit)
```

---

## 5. Struktur Modul & Navigasi File

### 5.1 Tampilan Antarmuka Frontend (`frontend-react/src/components/`)
| Nama File Komponen | Target Role | Fungsi Halaman |
| :--- | :--- | :--- |
| `OwnerDashboard.tsx` | Super Admin / Owner | Ringkasan statistik omset harian/bulanan, AOV, grafik penjualan, laba rugi, dan neraca saldo. |
| `ManagerDashboard.tsx` | Store Manager | Katalog menu, formula resep BOM, approval PO, approval waste, audit opname, dan rekap karyawan. |
| `WarehouseDashboard.tsx`| Admin Gudang | Pemantauan stok real-time, kartu stok FIFO, log mutasi bahan, dan formulir pengadaan PO. |
| `CashierPos.tsx` | Kasir | Terminal kasir sentuh, buka/tutup shift kas laci, keranjang belanja, cetak struk, dan pelunasan. |
| `BaristaKds.tsx` | Barista | Tampilan antrean dapur real-time, pengubah status pesanan, dan tombol darurat menu habis. |
| `AttendanceKiosk.tsx` | Toko / Tablet | Kiosk presensi bersama di outlet via scan QR ID staf atau input PIN. |
| `StaffMobileAttendance.tsx` | Semua Staf | Web presensi di smartphone karyawan dengan verifikasi QR poster outlet & GPS. |
| `CustomerOrder.tsx` | Pelanggan | Katalog menu mandiri pelanggan via scan QR meja (Mie Gacoan flow). |
| `OutletQrPoster.tsx` | Manager / Owner | Tampilan siap cetak poster QR meja dan poster QR absensi outlet. |
| `LoginPage.tsx` | Staf | Halaman otentikasi login multi-role dengan penerbitan token Bearer Sanctum. |

### 5.2 Logika Pemrosesan Backend (`backend-laravel/app/Http/Controllers/Api/`)
| Nama Controller | Grup Dokumentasi API | Fungsi Pemrosesan |
| :--- | :--- | :--- |
| `AuthController.php` | `01. Autentikasi Staf` | Login staf, cek sesi aktif, ambil profil user, dan logout. |
| `QrOrderController.php` | `02. Pelanggan QR Meja` | Validasi token meja, kalkulasi pesanan mandiri, dan lacak status pesanan. |
| `PaymentController.php` | `03. Pembayaran Midtrans` | Request Snap token payment gateway, webhook notifikasi, dan simulator sandbox. |
| `PosController.php` | `04. Kasir POS & Kas Laci`| Buka/tutup shift kasir, transaksi kasir langsung, dan rekonsiliasi kas fisik. |
| `KdsController.php` | `05. Barista KDS Dapur` | Antrean pesanan FIFO dapur, update status racik, dan toggle menu 86/sold-out. |
| `InventoryController.php`| `06. Gudang Stok Bahan` | Stok masuk manual, adjustment opname, laporan waste, dan riwayat kartu stok. |
| `PurchaseOrderController.php` | `07. Pengadaan Bahan PO` | Master supplier, pengajuan PO, persetujuan manajer, dan penerimaan fisik barang. |
| `ProductController.php` | `08. Manajer Menu & Resep`| Master produk & kategori, dan formula resep Bill of Materials (BOM). |
| `AuditController.php` | `09. Audit & Anti-Fraud` | Audit stock opname, rekonsiliasi kas laci, audit order void, dan log aktivitas. |
| `HrPayrollController.php`| `10. HR & Presensi Staf` | Presensi QR/GPS, kiosk absensi, monitoring live, dan reset device lock. |
| `AccountingController.php`| `11. Owner Akuntansi` | Bagan Akun (COA), Jurnal Umum otomatis, Neraca Saldo, dan Laba Rugi (P&L). |
| `DashboardController.php` | `12. Owner Statistik` | Business Intelligence metrik omset kotor/bersih, HPP aktual, dan tren performa. |

---

## 6. Skema Relasi Database (Data Model Overview)

Entitas data utama di dalam database sistem:

```
 users ───────1:1─────── employees ───────1:N─────── attendances
   │                         │
  1:N                       1:N
   │                         │
 cashier_shifts       purchase_orders ───1:N─── purchase_order_items
   │                         │                         │
  1:N                       N:1                       N:1
   │                         │                         │
 orders ─────────────► raw_materials ◄─────── stock_movements
   │                         ▲
  1:N                       1:N
   │                         │
 order_items ───N:1─── products ───1:N─── recipes
   │                         │
  1:N                       N:1
   │                         │
 order_item_modifiers    categories
```

* **`orders` & `order_items`**: Menyimpan rekaman transaksi penjualan kasir dan pemesanan meja pelanggan.
* **`products` & `recipes`**: Relasi Bill of Materials (BOM) yang menghubungkan 1 produk jadi dengan banyak bahan baku (`raw_materials`) beserta takaran pemakaian per porsi.
* **`raw_materials` & `stock_movements`**: Mencatat setiap gram/ml bahan yang masuk (*purchase/adjustment*) dan keluar (*sale/waste*) untuk menghasilkan kartu stok transparan.
* **`chart_of_accounts` & `journal_entries`**: Struktur akuntansi standar berbasis double-entry (Debit & Kredit balance) yang terhubung otomatis ke transaksi penjualan dan pengadaan.

---

## 7. Panduan Menjalankan Sistem (Setup & Development)

### Prasyarat
* PHP >= 8.2 & Composer
* Node.js >= 18 & npm
* PostgreSQL atau MySQL (tersedia di Laragon / local server)

### Langkah Menjalankan Backend:
```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*Dokumentasi REST API interaktif dapat dibuka di:* **`http://localhost:8000/docs/api`**

### Langkah Menjalankan Frontend:
```bash
cd frontend-react
npm install
npm run dev
```
*Aplikasi web frontend dapat dibuka di:* **`http://localhost:5173`**

### Kredensial Pengujian Bawaan:
* **Super Admin / Owner:** `admin@coffeeshop.test` / `password`
* **Store Manager:** `manager@coffeeshop.test` / `password`
* **Kasir:** `cashier@coffeeshop.test` / `password`
* **Barista:** `barista@coffeeshop.test` / `password`
* **Admin Gudang:** `warehouse@coffeeshop.test` / `password`
