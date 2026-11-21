# Konteks Proyek Skripsi: Aplikasi Pemesanan Mandiri CoffeeShop Berbasis Web Menggunakan QR Code

Berkas ini adalah panduan dan konteks kerja resmi untuk asisten AI (Antigravity, Claude Code, Cursor, Copilot, dll.) yang mendampingi pengerjaan skripsi ini. Seluruh instruksi, batasan, dan keputusan teknis wajib dipatuhi. Bahasa komunikasi: **Bahasa Indonesia**.

---

## 1. Identitas Penulis & Tugas Akhir

| Parameter | Data Resmi |
|---|---|
| **Mahasiswa (Penulis)** | **Faiz Rifki Syuhada** |
| **NIM** | **235610032** |
| **Program Studi** | **Sistem Informasi (Program Sarjana)** |
| **Fakultas** | **Teknologi Informasi (FTI)** |
| **Perguruan Tinggi** | **Universitas Teknologi Digital Indonesia (UTDI), Yogyakarta** |
| **Tahun Kelulusan Target** | **2026** |
| **Gelar Kesarjanaan** | **Sarjana Komputer (S.Kom)** |

**Judul Tugas Akhir:**
> **Rancang Bangun Aplikasi Pemesanan Mandiri Berbasis Web Menggunakan QR Code pada CoffeeShop**

---

## 2. Aturan Kerja untuk Agent AI (WAJIB & MUTLAK)

1. **Faiz adalah Penulis Utama:** Mahasiswa menandatangani lembar *Pernyataan Keaslian Tugas Akhir* bermeterai dan wajib mempertanggungjawabkan isi naskah serta kode program saat sidang pendadaran di depan dewan penguji.
2. **Kemandirian & Penguasaan Materi:** 
   - Agent **tidak boleh** membuat kode atau arsitektur yang berbelit-belit atau *over-engineered*.
   - Kode harus dibuat bersih, terstruktur, mudah dipelajari, dan setiap alur logika penting harus dapat dipahami oleh mahasiswa agar siap menghadapi pertanyaan penguji saat sidang.
   - Agent bertugas membantu menyusun kerangka bab, mereview naskah Word, menjelaskan diagram perancangan (UML/DFD/ERD), memperbaiki bug kode, dan menyiapkan simulasi latihan tanya-jawab sidang.
3. **Anti-Halusinasi (Fakta Wajib Nyata & Valid):**
   - Dilarang keras mengarang fitur atau istilah yang tidak ada dalam sistem.
   - Data pengujian, tabel basis data, rute API, dan diagram harus 100% sinkron dengan kode sumber yang ada di repositori ini.
4. **Bebas Kata Ganti Orang Pertama:**
   - Sesuai kaidah naskah akademik FTI UTDI, seluruh penjelasan naskah dan komunikasi formal wajib menggunakan **kalimat pasif**, tanpa kata ganti orang pertama (*saya, aku, kami, kita*).
5. **Hindari Jargon Berlebihan:**
   - Tidak menggunakan istilah rumit seperti "BOM" atau "ESB" dalam penyajian hasil skripsi; gunakan istilah bahasa Indonesia baku yang ramah sidang: *"Formula Resep Komposisi Bahan"*, *"Sistem Layanan Terpadu Multi-Peran"*, dan *"Pemesanan Mandiri Meja"*.
6. **Data Referensi Valid:**
   - Hanya menggunakan artikel jurnal nasional terakreditasi (SINTA) atau prosiding ilmiah yang benar-benar ada dan dapat diverifikasi keberadaannya.

---

## 3. Latar Belakang & Masalah Operasional

### Masalah Nyata di CoffeeShop Konvensional:
1. **Penumpukan Antrean di Meja Kasir:** Pada jam-jam sibuk (*peak hours*), pelanggan harus berdiri mengantre lama di kasir hanya untuk memilih menu dan membayar, memicu ketidaknyamanan ruang dan waktu tunggu (*waiting time*) yang tinggi.
2. **Kesalahan Pencatatan Manual (*Human Error*):** Pencatatan pesanan manual di kertas nota rentan memicu salah racik varian minuman (tingkat gula, pilihan es, ukuran cup, atau jenis susu) serta kekeliruan nomor meja.
3. **Pemisahan Data Kasir dan Gudang (*Data Silo*):** Transaksi kasir tidak langsung memotong stok bahan baku secara otomatis, menyulitkan monitoring sisa bahan di gudang.
4. **Antrean Dapur Tidak Tertib:** Dapur barista tidak memiliki antrean urut waktu masuk (*FIFO*), sehingga pesanan yang baru masuk sering kali diracik lebih dulu mendahului pesanan sebelumnya.
5. **Potensi Kebocoran Kas Kasir:** Kurangnya audit pencatatan modal awal dan rekonsiliasi kas fisik saat pergantian shift kasir.

### Solusi yang Diimplementasikan:
Sistem pemesanan mandiri berbasis web menggunakan **kode QR unik pada 5 Meja Utama (Meja 01 s/d Meja 05)** yang langsung terhubung ke:
- **Layar Dapur Barista KDS (*Kitchen Display System*):** Antrean otomatis urut waktu masuk (*First-In, First-Out* / FIFO).
- **Pengurangan Stok Otomatis:** Saldo persediaan bahan baku gudang otomatis berkurang berdasarkan takaran formula resep menu.
- **Terminal Kasir POS:** Kasir melayani pembayaran tunai maupun QRIS Midtrans dan mengelola modal shift kas laci.
- **Audit Penjualan & Anti-Fraud:** Dashboard Owner memantau omzet riil, pajak restoran PB1 (10%), rata-rata transaksi (AOV), menu terlaris, dan rekonsiliasi kas laci kasir per shift.

---

## 4. Keputusan Arsitektur & Teknologi

| Aspek | Spesifikasi Teknis | Keterangan |
|---|---|---|
| **Platform** | *Web Application* responsif | Dapat diakses melalui smartphone tamu (mobile web) & layar PC/tablet staf |
| **Frontend Framework** | **React 18** (TypeScript) + Vite | SPA modular, bebas galat tipe data (*strict typing*) |
| **CSS Styling** | **Tailwind CSS** + Lucide React | Desain modern, responsif, dan ringan |
| **Backend Framework** | **Laravel 11** (PHP 8.2+) | RESTful API, Eloquent ORM, Transaksi ACID |
| **Basis Data** | **MySQL 8.0** | Relasional murni, foreign key integrity |
| **Otentikasi Staf** | **Laravel Sanctum** | Autentikasi sesi Bearer Token multi-device |
| **Manajemen Hak Akses**| **Spatie Laravel Permission** | Role-Based Access Control (RBAC) 5 peran staf |
| **Pintu Pembayaran** | **Midtrans Snap / Core API** | Integrasi pembayaran nontunai QRIS & GoPay |
| **Metode Antrean Dapur**| **FIFO (First-In, First-Out)** | Antrean dapur berbasis urutan `created_at` transaksi |
| **Metode Presensi** | **QR Token + GPS Geofencing + Device Locking** | Anti-titip absen dengan penguncian ID browser perangkat |
| **Metode Pengujian** | **Black Box Testing + Pengujian Akurasi Mutasi** | Menguji fungsionalitas tombol, validitas hitung kas & pemotongan stok |

---

## 5. Matriks Hak Akses Pengguna (RBAC)

1. **Pelanggan (*Public / Guest*):** Memindai QR Meja (Meja 01 s/d Meja 05), melihat katalog menu aktif, kustomisasi varian (es, gula, topping), mengirim pesanan, dan melacak status peracikan secara waktu nyata.
2. **Kasir (`cashier`):** Menginput modal awal kas laci (*starting cash*), memproses transaksi langsung kasir (dine-in Meja 01-05 atau bungkus), konfirmasi pembayaran tunai/QRIS, cetak struk nota, dan tutup shift kas (*closing cash drawer*).
3. **Barista (`barista`):** Memantau layar KDS dapur urut waktu masuk FIFO, mengubah status racik (*Sedang Diracik* ➔ *Siap Saji*), dan sakelar darurat menu habis (*sold-out*).
4. **Admin Gudang (`warehouse_admin`):** Monitoring stok bahan baku, mencatat barang masuk manual (*inbound*), mengajukan pengadaan bahan (PO) ke supplier, dan input opname fisik.
5. **Store Manager (`store_manager`):** Mengelola katalog menu & formula resep, master 5 meja dan generator cetak QR meja, menyetujui PO pengadaan, menyetujui bahan rusak (*waste*), dan monitoring presensi karyawan.
6. **Pemilik Toko / Owner (`super_admin`):** Memantau Laporan Penjualan (omzet riil, pajak PB1 10%, total transaksi selesai, AOV, tren jam ramai, 5 menu terlaris), rekonsiliasi kas laci kasir per shift, dan peninjauan log audit aktivitas staf.

---

## 6. Struktur Basis Data (16 Tabel Relasional Utama)

Tabel-tabel yang aktif digunakan pada sistem:
1. `dining_tables`: Master 5 meja fisik (Meja 01 s/d Meja 05, token QR, kapasitas, status).
2. `orders`: Transaksi penjualan (nomor order, meja, shift kasir, nama pemesan, subtotal, PB1, total, status bayar).
3. `order_items`: Rincian item menu pesanan (menu, qty, harga satuan, subtotal, catatan khusus).
4. `order_item_modifiers`: Tambahan varian rasa/opsi per menu (gula, es, shot espresso).
5. `categories`: Kategori menu (Coffee, Non-Coffee, Pastry, Food).
6. `products`: Katalog produk menu aktif, harga jual, dan foto.
7. `recipes`: Formula takaran resep pemakaian bahan baku per porsi menu.
8. `modifiers`: Master kustomisasi varian dan biaya tambahannya.
9. `raw_materials`: Persediaan bahan baku fisik di gudang (kopi, susu, sirup, cup).
10. `stock_movements`: Kartu stok riwayat mutasi bahan masuk (*in*) dan keluar (*out_sale / waste*).
11. `purchase_orders`: Dokumen pengadaan bahan baku ke supplier luar.
12. `suppliers`: Data rekanan vendor/supplier bahan baku.
13. `cashier_shifts`: Pencatatan kas laci kasir (modal awal, total penjualan kas, kas fisik akhir, dan selisih kas).
14. `users`: Akun login pengguna sistem.
15. `employees`: Data induk karyawan (posisi, kode karyawan, device_id lock, qr_token).
16. `attendances`: Riwayat presensi kehadiran karyawan (jam masuk, jam pulang, toleransi terlambat, titik GPS).
17. `audit_logs`: Rekam jejak seluruh aksi penting staf untuk audit keamanan (*anti-fraud*).

---

## 7. Ketentuan Format Naskah Skripsi FTI UTDI 2026

Berdasarkan pedoman resmi skripsi Fakultas Teknologi Informasi UTDI tahun 2026:
- **Kertas & Margin:** A4 (70/80 gram), Margin: **Atas 4 cm, Kiri 4 cm, Kanan 3 cm, Bawah 3 cm**.
- **Tipografi:** *Times New Roman* 12 pt, spasi teks 1,5. Isi tabel 10 pt spasi 1.
- **Bahasa:** Bahasa Indonesia baku (EYD), **kalimat pasif murni**, tanpa kata ganti orang pertama (*saya/kami/kita*), istilah asing dicetak miring (*italic*).
- **Tata Letak Judul:**
  - **Tabel:** Judul diletakkan di **atas** tabel, tengah, tebal (contoh: **Tabel 3.2 Spesifikasi Perangkat Keras**).
  - **Gambar / Diagram:** Judul diletakkan di **bawah** gambar, tengah, tebal (contoh: **Gambar 3.5 DFD Level 1 Dekomposisi Sistem**).
- **Format Sitasi:** Sistem Nama–Tahun (contoh: *Santoso dan Wulandari (2023)* atau *(Nurhadi dan Salam, 2022)*).
- **Intisari:** Maksimal 250 kata, 3–4 alinea, spasi tunggal (1), memuat 3–5 kata kunci urut abjad dan dicetak miring.

### Sistematika Bab:
- **BAB I Pendahuluan:** 1.1 Latar Belakang, 1.2 Rumusan Masalah, 1.3 Ruang Lingkup (poin batasan sistem), 1.4 Tujuan Penelitian, 1.5 Manfaat Penelitian, 1.6 Sistematika Penulisan.
- **BAB II Tinjauan Pustaka dan Dasar Teori:** 2.1 Tinjauan Pustaka (ulasan perbandingan minimal 5 jurnal terdahulu), 2.2 Dasar Teori (Konsep Pemesanan Mandiri, QR Code, KDS & FIFO, Kasir POS, Laravel, MySQL, Black Box Testing).
- **BAB III Metode Penelitian:** 3.1 Bahan dan Peralatan Penelitian, 3.2 Prosedur dan Pengumpulan Data (Observasi & Wawancara), 3.3 Analisis Kebutuhan Sistem (Fungsional & Non-Fungsional), 3.4 Perancangan Sistem (DFD Level 0, 1, 2, ERD, Struktur Database Relasional, dan Antarmuka).
- **BAB IV Implementasi dan Pembahasan:** 4.1 Implementasi Sistem (Tampilan Layar & Basis Data), 4.2 Pengujian Sistem (Tabel Uji Black Box Testing & Pembahasan Hasil).
- **BAB V Penutup:** 5.1 Kesimpulan (menjawab tujuan di Bab I), 5.2 Saran (pengembangan masa depan: mobile app native, push notification).
- **Daftar Pustaka & Lampiran** (Struk uji coba, surat keterangan penelitian, kuesioner pengujian).

---

## 8. Referensi Jurnal Terverifikasi (Nyata & Bukan Fiktif)

Daftar artikel ilmiah yang relevan dan dapat diverifikasi:
1. **Pratama, E. B., dan A. Hendini. 2019.** Rancang Bangun Sistem Informasi Pemesanan Makanan dan Minuman Berbasis Web Menggunakan QR Code. *Jurnal Khatulistiwa Informatika* 7(2): 101–107.
2. **Setiawan, A., dan D. Kurniawan. 2021.** Implementasi Quick Response Code (QR Code) Pada Sistem Pemesanan Menu Restoran Berbasis Web. *Jurnal Algoritma, Logika dan Komputasi* 4(1): 45–52.
3. **Nurhadi, A., dan A. Salam. 2022.** Penerapan Framework Laravel pada Rancang Bangun Sistem Informasi Penjualan Coffee Shop Berbasis Web. *Jurnal Teknologi Sistem Informasi* 3(1): 112–123.
4. **Santoso, B., dan R. Wulandari. 2023.** Rancang Bangun Sistem Informasi Point of Sale (POS) Berbasis Web Menggunakan Framework Laravel pada Coffee Shop. *Jurnal Rekayasa Informasi* 12(2): 88–96.
5. **Saputra, A. 2020.** Penerapan Konsep FIFO pada Sistem Antrean Pesanan Dapur Restoran Berbasis Web. *Jurnal Tekno Kompak* 14(1): 22–27.
6. **Wijaya, H., dan S. Rahardjo. 2021.** Perancangan Sistem Pemesanan Mandiri Meja Menggunakan Quick Response Code untuk Mengurangi Waktu Tunggu Pelanggan. *Jurnal Ilmiah Komputasi* 20(3): 315–324.
7. **Kurniawan, R., dan O. M. Febriani. 2022.** Penerapan Model View Controller (MVC) pada Rancang Bangun Sistem Informasi Kasir Menggunakan Framework Laravel. *Jurnal Informatika dan Rekayasa Perangkat Lunak* 3(2): 178–186.
8. **Hidayat, T., dan M. Muttaqin. 2020.** Pengujian Sistem Informasi Berbasis Web dengan Metode Black Box Testing Equivalence Partitions. *Jurnal Sisfokom* 9(3): 400–408.

---

## 9. Status Dokumen & Progres Terkini

- **Naskah Skripsi:** Berkas `Skripsi_Faiz_Rifki_Syuhada_Bab_I-IV.docx` (Bab I s/d IV telah tersusun, memerlukan sinkronisasi redaksi akhir 5 meja dan eliminasi modul akuntansi).
- **Aplikasi Web:**
  - Backend Laravel 11: Rute API lengkap (`/api/qr/*`, `/api/pos/*`, `/api/kds/*`, `/api/procurement/*`, `/api/audit/*`).
  - Frontend React 18: Antarmuka Pelanggan QR Meja 01-05, Kasir POS, Barista KDS, Gudang, Store Manager, dan Dashboard Owner ringkas.
  - Diagram: Berkas vektor SVG resmi tersedia di folder `public/diagrams/` (Struktur Database, ERD, DFD Level 0, 1, 2).
- **Repositori:** Branch `main` pada `https://github.com/Syuubtw/coffeeshop-esb-system.git`.

---

## 10. Rencana Langkah Kerja Berikutnya

1. **Sinkronisasi Akhir Dokumen Word:** Memperbarui naskah skripsi Bab I–IV agar redaksi teksnya 100% selaras dengan 5 meja utama dan penyederhanaan dashboard owner.
2. **Penyisipan Diagram Resolusi Tinggi:** Memastikan seluruh diagram SVG/PNG beresolusi tajam disematkan pada Bab III dan Bab IV naskah.
3. **Penyusunan Bab V (Penutup):** Merumuskan kesimpulan spesifik yang menjawab tujuan penelitian serta saran pengembangan.
4. **Tabel Pengujian Black Box:** Melengkapi tabel skenario uji coba fungsionalitas (pemindaian QR, validasi meja, mutasi stok otomatis, dan rekonsiliasi kasir).
5. **Simulasi Tanya Jawab Sidang:** Menyiapkan daftar pertanyaan kritis dewan penguji beserta strategi jawaban yang lugas dan tepat.
