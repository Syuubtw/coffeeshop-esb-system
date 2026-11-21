# BLUEPRINT & ARSITEKTUR SISTEM
# CoffeeShop POS & Kitchen-Warehouse Integrated System
> **Sistem Informasi Pemesanan CoffeeShop Berbasis Web Menggunakan QR Code Terintegrasi Kasir, KDS Barista, Inventori Stok, dan Audit Penjualan**

---

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Visi Sistem
Sistem ini dirancang sebagai solusi terpadu untuk industri *Food & Beverage* (F&B), khususnya kafe/coffee shop, yang menghubungkan operasional **Front-Office** (Pemesanan Mandiri Pelanggan via QR Code Meja dan Kasir POS) dengan operasional **Back-Office** (Layar Dapur Barista KDS, Pemotongan Stok Bahan Baku Otomatis, Pengadaan Bahan PO, Presensi Karyawan Anti-Titip Absen, serta Dashboard Audit Penjualan Eksekutif).

### 1.2 Masalah Operasional yang Diselesaikan
Pada operasional kedai kopi konvensional, sering ditemukan kendala:
1. **Antrean Kasir Menumpuk:** Pelanggan harus berdesakan di meja kasir saat jam sibuk (*rush hour*) hanya untuk melihat buku menu dan memesan.
2. **Data Terpisah (*Data Silo*):** Kasir mencatat pesanan, namun stok persediaan bahan baku di gudang tidak otomatis berkurang sesuai takaran resep.
3. **Keterlambatan & Kesalahan Dapur:** Pesanan kertas rentan hilang atau teracak, menyebabkan barista salah meracik atau mendahulukan pesanan yang baru masuk (*non-FIFO*).
4. **Kebocoran Selisih Kasir & Stok (*Fraud*):** Tidak adanya pencatatan rekonsiliasi kas laci kasir saat pergantian shift (*cash drawer count*) serta minimnya pencatatan audit log aktivitas sistem.

### 1.3 Solusi Terintegrasi yang Diterapkan
Sistem menghubungkan seluruh titik operasional melalui arsitektur terintegrasi:
* **Pemesanan QR Meja Mandiri (5 Meja Utama):** Pelanggan duduk di meja (Meja 01 s/d Meja 05), memindai kode QR unik meja, memilih varian menu, dan langsung mengirimkan pesanan.
* **Pengurangan Stok Otomatis Berbasis Resep:** Saat pesanan terbentuk, sistem secara otomatis menghitung dan memotong saldo bahan baku pada kartu stok berdasarkan takaran formula resep menu.
* **Antrean Dapur Terotomasi (FIFO):** Tiket pesanan diteruskan secara langsung ke layar Barista KDS (*Kitchen Display System*) terurut berdasarkan waktu masuk terlama.
* **Audit & Laporan Penjualan Real-Time:** Dashboard Owner menyajikan metrik omzet riil (transaksi lunas), setoran pajak restoran (PB1 10%), rata-rata transaksi (AOV), menu terlaris, serta rekonsiliasi kas laci kasir per shift.

---

## 2. Arsitektur Teknologi (Tech Stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / FRONTEND                             │
│                  React 18 + TypeScript + Vite + Tailwind CSS            │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐  │
│  │   Customer Order QR   │    Cashier POS UI    │   Barista KDS UI   │  │
│  │    (5 Meja Mandiri)   │  (Shift & Transaksi) │    (Urut FIFO)     │  │
│  ├───────────────────────┼──────────────────────┼────────────────────┤  │
│  │  Warehouse Dashboard  │  Manager Dashboard   │  Owner Dashboard   │  │
│  │  (Stok & Pengadaan)   │ (Menu, Resep & QR)   │ (Penjualan & Audit)│  │
│  └───────────────────────┴──────────────────────┴────────────────────┘  │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ HTTP REST JSON / Bearer Token
┌────────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND SERVICE (API GATEWAY)                     │
│                        Laravel 11 + PHP 8.2+                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Auth & RBAC (Laravel Sanctum + Spatie Permission)               │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   Operational Controllers (POS, QR Order, KDS, Stock, PO, Audit)  │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   Business Logic & Services (InventoryEngine, AuditService)       │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │   Dokumentasi API Terbuka (Dedoc Scramble / OpenAPI)              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
                   ▼                                   ▼
        ┌─────────────────────┐             ┌─────────────────────┐
        │  DATABASE STORAGE   │             │   EXTERNAL SERVICES │
        │     MySQL 8.0       │             │  Midtrans Sandbox   │
        │  Relational Storage │             │   Payment Gateway   │
        └─────────────────────┘             └─────────────────────┘
```

| Komponen | Teknologi | Peran & Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) | *Single Page Application* (SPA) dengan pengetikan data yang ketat dan komponen modular. |
| **Bundler & Tooling** | Vite 8 + Tailwind CSS | Kompilasi kilat, styling antarmuka modern, dan responsif untuk layar kasir/tablet. |
| **Backend Framework** | Laravel 11 (PHP 8.2+) | Arsitektur RESTful API, ORM Eloquent, dan transaksi basis data berintegritas tinggi. |
| **Otentikasi & Keamanan** | Laravel Sanctum | Pengelolaan sesi berbasis Bearer Token untuk seluruh akun staf. |
| **Hak Akses Pengguna** | Spatie Laravel Permission | Pengendalian otorisasi berbasis peran (*Role-Based Access Control* / RBAC). |
| **Database Engine** | MySQL 8.0 | Penyimpanan data relasional dengan integritas *Foreign Key* dan *ACID transactions*. |
| **Dokumentasi API** | Dedoc Scramble | Generator dokumentasi API interaktif otomatis di rute `/docs/api`. |
| **Payment Gateway** | Midtrans Core API / Snap | Fasilitas pembayaran nontunai QRIS dan simulasi transaksi terintegrasi. |

---

## 3. Matriks Hak Akses & Peran Pengguna (RBAC)

Akses sistem terbagi menjadi 5 peran operasional internal serta 1 peran publik pelanggan:

| Peran | Kode Role | Wewenang & Cakupan Menu Sistem |
| :--- | :--- | :--- |
| **Pemilik Toko (Owner)** | `super_admin` | Akses eksekutif: Laporan Penjualan (Omset Riil, Pajak Restoran PB1 10%, Total Transaksi Selesai, AOV, Tren Harian, Top 5 Menu Terlaris, Jam Ramai, Analisis QRIS vs Tunai), Rekonsiliasi Kas Laci Kasir (*Cash Drawer Balance*), dan Log Audit Trail Anti-Fraud. |
| **Store Manager** | `store_manager` | Pengelolaan operasional toko: Master Katalog Menu, Formula Resep Komposisi Bahan, Manajemen 5 Meja & Generator Cetak QR Meja, Persetujuan PO Pengadaan, Persetujuan Pemusnahan (*Waste*), dan Rekap Presensi Karyawan. |
| **Admin Gudang** | `warehouse_admin` | Pengelolaan inventori fisik: Pemantauan Stok Bahan Baku, Input Stok Masuk Manual (*Inbound*), Pengajuan Pengadaan PO ke Supplier, Penerimaan Barang Datang, dan Input Opname Fisik. |
| **Kasir** | `cashier` | Operasional kasir: Buka/Tutup Shift Kas Laci (*Starting & Closing Cash*), Pemrosesan Pesanan Langsung (Meja 01 s/d Meja 05 atau Bungkus), Konfirmasi Pelunasan Tunai/QRIS, dan Cetak Struk Bukti Bayar. |
| **Barista** | `barista` | Operasional peracikan dapur: Antrean pesanan layar KDS terurut waktu masuk (FIFO), Pembaruan status peracikan (*Sedang Diracik* ➔ *Siap Saji*), dan Sakelar Darurat Menu Habis (*Sold Out*). |
| **Karyawan** | `employee` | Presensi mandiri melalui pemindaian QR poster outlet dengan penguncian perangkat (*Device Binding*) dan validasi jarak GPS (*Geofencing*). |
| **Pelanggan** | *Public / Guest* | Akses mandiri katalog menu dan pembuatan pesanan melalui pemindaian QR meja tanpa kewajiban login. |

---

## 4. Alur Proses Bisnis Terintegrasi (Core Workflows)

### 4.1 Alur Pemesanan Mandiri Meja Pelanggan (QR Table Flow)
```
[Pelanggan Duduk di Meja 01 s/d Meja 05]
       │
       ▼
[Pindai QR Code Unik Meja] ➔ [GET /api/qr/table/{token}] (Verifikasi Meja & Muat Menu Aktif)
       │
       ▼
[Pilih Menu & Kustomisasi Varian] (Opsi Gula, Es, dan Catatan Tambahan)
       │
       ▼
[Kirim Pesanan] ➔ [POST /api/qr/order]
       │
       ├─► 1. Status Meja diperbarui menjadi OCCUPIED
       ├─► 2. Saldo bahan baku dipotong otomatis sesuai formula resep menu
       ├─► 3. Dicatat riwayat mutasi bahan OUT_SALE pada kartu stok
       ├─► 4. Tiket pesanan otomatis terbit di Layar Dapur Barista KDS
       └─► 5. Pelanggan dapat memantau status pesanan secara waktu nyata di peramban
```

### 4.2 Alur Antrean Dapur Barista (Kitchen Display System - FIFO)
```
[Pesanan Masuk dari Pemesanan QR / Terminal Kasir]
       │
       ▼
[Layar Antrean Barista KDS] (GET /api/kds/queue)
Tiket ditampilkan terurut berdasarkan waktu masuk pesanan paling awal (FIFO)
       │
       ▼
[Barista Memilih "Mulai Racik"] ➔ [PATCH /api/kds/orders/{id}/status] (PREPARING)
       │
       ▼
[Barista Memilih "Siap Saji"] ➔ (READY)
       │
       ▼
[Pesanan Diantar ke Meja / Diambil Tamu] ➔ (SERVED / COMPLETED)
       │
       └─► Status meja kembali AVAILABLE saat transaksi diselesaikan
```

### 4.3 Alur Pengadaan Bahan Baku Gudang (Procurement Flow)
```
[Indikator Bahan Baku Menipis] (< Min Stock Alert)
       │
       ▼
[Admin Gudang Mengajukan PO] ➔ [POST /api/procurement/orders] (Status: PENDING_APPROVAL)
       │
       ▼
[Store Manager Meninjau & Menyetujui PO] ➔ [PATCH /api/procurement/orders/{id}/approve]
       │
       ▼
[Supplier Mengirimkan Pesanan Bahan ke Outlet]
       │
       ▼
[Admin Gudang Konfirmasi Penerimaan Fisik] ➔ [POST /api/procurement/orders/{id}/receive]
       │
       ├─► 1. Saldo stok fisik bahan bertambah otomatis
       ├─► 2. Sistem memperbarui harga modal rata-rata bahan baku
       └─► 3. Dicatat log mutasi stok masuk IN_PURCHASE
```

### 4.4 Alur Presensi Karyawan Anti-Titip Absen (Geofencing & Device Binding)
```
[Karyawan Tiba di Outlet Toko]
       │
       ▼
[Pindai QR Poster Outlet Menggunakan Smartphone]
       │
       ├─► 1. Validasi GPS Geofencing (Pemeriksaan radius jarak meter ke titik lokasi kafe)
       ├─► 2. Validasi Device ID Binding (ID unik perangkat pertama kali terkunci pada profil akun)
       │      Jika digunakan di HP lain ➔ Ditolak: "Perangkat tidak terdaftar / indikasi titip absen"
       └─► 3. Pencatatan Waktu Masuk/Pulang ➔ Tercatat Tepat Waktu atau Terlambat (menit)
```

---

## 5. Struktur Modul & Navigasi Berkas Sistem

### 5.1 Antarmuka Frontend (`frontend-react/src/components/`)
| Nama Komponen | Pengguna Utama | Fungsi Utama |
| :--- | :--- | :--- |
| `OwnerDashboard.tsx` | Pemilik Toko (Owner) | Ringkasan omset penjualan riil, setoran pajak PB1, total transaksi, rata-rata belanja (AOV), analisis jam ramai, grafik produk terlaris, serta rekonsiliasi kas laci kasir dan audit log transaksi. |
| `ManagerDashboard.tsx` | Store Manager | Pengelolaan menu, penetapan formula resep bahan, persetujuan PO, persetujuan bahan rusak, serta monitoring presensi staf. |
| `TableQrGenerator.tsx` | Store Manager | Generator kode QR khusus untuk Meja 01 s/d Meja 05 dengan pratinjau tata letak cetak siap pakai. |
| `WarehouseDashboard.tsx`| Admin Gudang | Pemantauan stok bahan baku *real-time*, kartu stok riwayat mutasi, pencatatan stok masuk, dan pengajuan PO supplier. |
| `CashierPos.tsx` | Kasir | Terminal kasir: buka/tutup shift kas laci, pemilihan Meja 01 s/d Meja 05 atau bungkus, pelunasan kas/QRIS, dan cetak struk. |
| `BaristaKds.tsx` | Barista | Layar antrean peracikan dapur berbasis waktu (FIFO), pembaruan status pengerjaan, dan sakelar status menu habis. |
| `CustomerOrder.tsx` | Pelanggan | Antarmuka pemesanan mandiri responsif via QR meja: katalog berfoto, pemilihan varian, dan pelacakan pesanan. |
| `StaffLayout.tsx` | Seluruh Staf | Kerangka tata letak navigasi atas dengan pemisahan menu dinamis sesuai peran otentikasi. |

### 5.2 Pengontrol Logika Backend (`backend-laravel/app/Http/Controllers/Api/`)
| Nama Controller | Fokus Layanan | Peran Pemrosesan |
| :--- | :--- | :--- |
| `AuthController.php` | Otentikasi Staf | Proses login akun staf, verifikasi token aktif, pengambilan data profil, dan logout. |
| `QrOrderController.php` | Pemesanan Pelanggan | Validasi token meja (Meja 01 s/d Meja 05), penyimpanan pesanan mandiri, dan pelacakan status. |
| `PosController.php` | Kasir & Shift Kas | Buka/tutup shift kas laci, perhitungan selisih kas fisik, dan transaksi pemesanan langsung kasir. |
| `PaymentController.php` | Pembayaran Nontunai | Integrasi transaksi Midtrans Snap token, penanganan notifikasi webhook, dan verifikasi status bayar. |
| `KdsController.php` | Antrean Dapur | Pengambilan antrean pesanan aktif urut waktu FIFO dan pembaruan status peracikan menu. |
| `InventoryController.php`| Inventori Gudang | Penyesuaian stok masuk, pencatatan bahan rusak (*waste*), kartu stok, dan manajemen opname. |
| `PurchaseOrderController.php`| Pengadaan Bahan | Pengelolaan master supplier, pengajuan dan persetujuan PO, serta verifikasi penerimaan barang. |
| `ProductController.php` | Menu & Resep | Master kategori, produk, varian/modifier, dan formula pemakaian bahan baku per porsi menu. |
| `AuditController.php` | Audit Trail Kasir | Audit log aktivitas staf, riwayat rekonsiliasi kas laci kasir, dan peninjauan pembatalan transaksi. |
| `HrPayrollController.php`| SDM & Presensi | Presensi mandiri via scan QR outlet dengan validasi GPS geofencing dan device locking anti-fraud. |
| `DashboardController.php` | Laporan Owner | Agregasi data statistik penjualan, perhitungan omset riil, pajak restoran PB1, dan produk terlaris. |

---

## 6. Struktur Skema Basis Data Relasional

Keterhubungan antar entitas tabel utama pada basis data MySQL 8.0:

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
   │                         ▲                         ▲
  1:N                       1:N                       1:N
   │                         │                         │
 order_items ───N:1─── products ───1:N─── recipes   stock_opnames
   │                         │
  1:N                       N:1
   │                         │
 order_item_modifiers    categories
```

* **`dining_tables`**: Menyimpan 5 meja fisik utama (Meja 01 s/d Meja 05) beserta token QR dan status ketersediaannya.
* **`orders` & `order_items`**: Rekaman transaksi penjualan, keterkaitan nomor meja, shift kasir, metode pembayaran, pajak PB1, dan rincian menu.
* **`products` & `recipes`**: Menghubungkan menu makanan/minuman jadi dengan kebutuhan takaran bahan baku gudang (`raw_materials`).
* **`raw_materials` & `stock_movements`**: Mencatat mutasi saldo stok masuk (*purchase/adjustment*) dan stok keluar (*sales/waste*) untuk kartu stok.
* **`cashier_shifts`**: Menyimpan rekam jejak modal awal kas laci kasir, penjualan tunai, kas fisik akhir, dan selisih kas per shift.
* **`audit_logs`**: Mencatat setiap aktivitas penting staf (pembayaran, pembatalan pesanan, perubahan resep, persetujuan pengadaan) guna menjamin transparansi operasional.

---

## 7. Panduan Menjalankan Sistem (Setup & Development)

### Prasyarat Perangkat Lunak
* PHP >= 8.2 & Composer
* Node.js >= 18 & npm
* Server MySQL 8.0 (tersedia melalui Laragon / XAMPP)

### Menjalankan Backend (Laravel 11):
```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*Dokumentasi REST API interaktif:* **`http://localhost:8000/docs/api`**

### Menjalankan Frontend (React 18):
```bash
cd frontend-react
npm install
npm run dev
```
*Antarmuka Web:* **`http://localhost:5173`**

### Kredensial Akun Pengujian Bawaan:
* **Pemilik Toko (Owner):** `admin@coffeeshop.test` / `password`
* **Store Manager:** `manager@coffeeshop.test` / `password`
* **Kasir:** `cashier@coffeeshop.test` / `password`
* **Barista:** `barista@coffeeshop.test` / `password`
* **Admin Gudang:** `warehouse@coffeeshop.test` / `password`
