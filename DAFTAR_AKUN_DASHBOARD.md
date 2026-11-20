# ☕ DAFTAR LINK AKSES & AKUN DASHBOARD (COFFEESHOP ESB & POS)

Sistem sudah **dipisah 100% menggunakan URL Routing mandiri**. Pelanggan yang scan barcode meja tidak akan pernah melihat halaman login staf lagi!

---

## 📱 1. LINK PELANGGAN (PUBLIC - SCAN QR MEJA TANPA LOGIN)

Pelanggan cukup membuka link sesuai nomor meja fisik tempat mereka duduk:

- **Meja 01:** 👉 `http://localhost:3000/order/table/TB-01`
- **Meja 02:** 👉 `http://localhost:3000/order/table/TB-02`
- **Meja 03:** 👉 `http://localhost:3000/order/table/TB-03`
- **Meja 04:** 👉 `http://localhost:3000/order/table/TB-04`
- **Meja VIP:** 👉 `http://localhost:3000/order/table/TB-VIP`

> **Fitur Pelanggan:**
>
> - Katalog menu kopi & makanan live.
> - Kustomisasi level manis, es batu, dan susu oat.
> - Checkout langsung via QRIS atau opsi Bayar di Kasir.
> - **Zero Login:** Pelanggan tidak perlu login atau input password apapun.

---

## 🔒 2. LINK PORTAL INTERNAL STAF (DIPROTEKSI LOGIN ROLE)

Untuk mengakses dashboard staf, buka:  
👉 **`http://localhost:3000/login`**

### Kredensial Akun Default (Password semua akun: `password`):

| Role / Jabatan             | Email Login               | URL Akses Langsung              | Fitur & Wewenang                                                                                       |
| -------------------------- | ------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **👑 Owner (Faiz Rifki Syuhada)** | `admin@coffeeshop.test`   | `http://localhost:5173/admin`   | **Laporan Finansial**, **Laba Rugi (P&L)**, **Buku Jurnal Umum (Double-Entry)**, **Neraca Saldo (Trial Balance)**, **Audit Trail Log Staf**, **Rekonsiliasi Kas Kasir (Shift)**, **Audit Void & Diskon** |
| **👔 Store Manager**       | `manager@coffeeshop.test` | `http://localhost:5173/manager` | Master Stok Gudang, Kelola Menu & Resep (BOM), Approval Stock Opname, Presensi Staf, Rekap Shift Kasir |
| **📦 Admin Gudang & Purchasing** | `warehouse@coffeeshop.test` | `http://localhost:5173/warehouse` | **Pusat Logistik & Inbound:** Master Stok Gudang, Input Penerimaan Barang Supplier (Stock In), Input Hitung Fisik (Stock Opname), Mutasi & Kartu Stok |
| **💻 Kasir (Cashier)**     | `cashier@coffeeshop.test` | `http://localhost:5173/pos`     | Layar Kasir Touchscreen POS, Input Pesanan Dine-in/Takeaway, Terima Bayar QRIS & Bank EDC              |
| **☕ Barista (Dapur / KDS)**| `barista@coffeeshop.test` | `http://localhost:5173/kds`     | Layar Kitchen Display System (KDS), Pantau Antrean Minuman Masuk & Update Status Peracikan              |
| **⏱️ Kiosk Presensi Karyawan** | *(Semua Staf)* | `http://localhost:5173/attendance` | **Absensi Mandiri Real-Time:** Karyawan bisa Clock-In dan Clock-Out mandiri di tablet/HP masing-masing |

---

## 📖 3. DOKUMENTASI API & KREDENSIAL LOGIN API

- **Dokumentasi Interaktif (API Docs):** 👉 `http://localhost:8000/docs/api`
- **Database:** PostgreSQL `coffeeshop_db` di port `5432`

---

### 🔑 Kredensial Email & Password untuk Mengakses API:

Endpoint Login API: **`POST http://localhost:8000/api/auth/login`**

| Peran (Role) | Email API | Password | Hak Akses API |
| :--- | :--- | :--- | :--- |
| **👑 Super Admin (Owner)** | `admin@coffeeshop.test` | `password` | **Full Access:** Akuntansi (`/api/accounting/*`), Audit Forensik (`/api/audit/*`), Menu & Resep (`/api/menu/*`), Laba Rugi, Jurnal Umum |
| **👔 Store Manager** | `manager@coffeeshop.test` | `password` | Master Stok Gudang (`/api/inventory/*`), Approval Stock Opname, Shift Kasir, Approval Waste Basi/Tumpah |
| **📦 Admin Gudang & Purchasing** | `warehouse@coffeeshop.test` | `password` | Inventaris Gudang (`/api/inventory/*`), Input Inbound Stock-In, Pengajuan Stock Opname (`/api/audit/stock-opnames`) |
| **💻 Kasir Frontline** | `cashier@coffeeshop.test` | `password` | Order Kasir (`/api/pos/orders`), Buka/Tutup Shift, Pembayaran QRIS & Tunai |
| **☕ Barista Dapur** | `barista@coffeeshop.test` | `password` | Antrean Kitchen Order KDS (`/api/kds/*`), Update Status Peracikan Minuman |

---

### 🚀 Cara Login & Menggunakan Bearer Token di API Docs:

#### Opsi 1: Pakai Fitur 1-Click Login di Halaman API Docs (Paling Cepat)
1. Buka `http://localhost:8000/docs/api`
2. Di baris atas, klik tombol **`[ ⚡ Super Admin ]`** atau **`[ 👔 Store Manager ]`**
3. Status bar seketika berubah menjadi **`🟢 SEDANG LOGIN`**
4. Token otomatis terpasang untuk seluruh request pengujian API (Try It / Send Request).

#### Opsi 2: Manual via cURL / Postman / Swagger Body
Kirim request **POST** ke `http://localhost:8000/api/auth/login`:
```json
{
  "email": "admin@coffeeshop.test",
  "password": "password"
}
```

Respons Berhasil:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@coffeeshop.test",
      "roles": ["super_admin"]
    },
    "token": "1|8Y1nZ3qAbC... (salin token ini)",
    "token_type": "Bearer"
  }
}
```

Untuk mengakses endpoint yang diproteksi, sertakan Header HTTP:
```http
Authorization: Bearer <token_dari_respons_diatas>
Accept: application/json
```

---

### 🚥 Cek Status Login API:
Anda dapat memeriksa apakah token Anda aktif atau belum melalui endpoint:  
👉 **`GET http://localhost:8000/api/auth/status`**
- **🟢 HIJAU:** Sedang login (token valid)
- **🔴 MERAH:** Belum login (akses ditolak HTTP 401)
