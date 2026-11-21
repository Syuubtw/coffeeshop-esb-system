# -*- coding: utf-8 -*-
"""
Thesis content module containing comprehensive academic text, tables, and diagram frames for BAB III.
"""

from build_thesis_full import p, heading, caption, table, frame_diagram

def get_bab3_elements():
    elems = []
    
    # BAB III Heading (Heading 1)
    elems.append(heading("BAB III\nMETODE PENELITIAN", level=1, space_before=240, space_after=180))
    elems.append(p("Bab ini menyajikan secara komprehensif metodologi rekayasa perangkat lunak yang diterapkan dalam penelitian rancang bangun aplikasi pemesanan mandiri berbasis web menggunakan QR Code pada gerai coffeeshop. Pembahasan mencakup identifikasi bahan dan data penelitian, spesifikasi peralatan perangkat keras dan perangkat lunak pendukung, prosedur pengumpulan data, analisis kebutuhan fungsional dan non-fungsional sistem, perancangan diagram terstruktur (Flowchart, DFD Level 0, DFD Level 1, dan DFD Level 2), perancangan konseptual basis data (ERD), perancangan fisik basis data 16 tabel relasional, serta perancangan antarmuka pengguna."))
    
    # 3.1 Bahan dan Peralatan Penelitian
    elems.append(heading("3.1  Bahan dan Peralatan Penelitian", level=2))
    
    # 3.1.1
    elems.append(heading("3.1.1  Bahan dan Data Penelitian", level=3))
    elems.append(p("Bahan dan data penelitian yang dikumpulkan dan dimanfaatkan dalam proses perancangan, pengembangan, dan pengujian sistem diklasifikasikan ke dalam tujuh kelompok data operasional utama sebagai berikut:"))
    elems.append(p("1. Data Meja Pelanggan: Data pengenal unik untuk 5 meja fisik utama gerai (Meja 01 sampai dengan Meja 05), meliputi nomor identitas meja (TB-01 s/d TB-05), token acak unik berbasis UUID untuk pembangkitan QR Code aman, kapasitas tempat duduk (2, 4, hingga 6 kursi), dan status ketersediaan operasional meja (AVAILABLE, OCCUPIED)."))
    elems.append(p("2. Data Kategori dan Katalog Menu: Data produk makanan dan minuman yang ditawarkan, mencakup kategori menu (Coffee, Non-Coffee, Pastry, Meals), nama produk, deskripsi profil rasa, harga dasar jual, status ketersediaan (aktif atau sold out), dan berkas citra visual produk."))
    elems.append(p("3. Data Formula Resep Komposisi Bahan: Data takaran baku pemakaian bahan mentah untuk setiap porsi menu sajian (misalnya takaran gramasi biji kopi espresso, mililiter susu segar/fresh milk, mililiter sirup rasa, dan satu unit cup kertas/plastik) guna mendukung pemotongan saldo persediaan secara otomatis."))
    elems.append(p("4. Data Persediaan Bahan Baku Gudang: Data saldo fisik bahan baku di gudang (kopi, susu, gula aren, sirup vanila, cup 12oz, cup 16oz), batas minimum stok aman (safety stock), serta pencatatan riwayat kartu mutasi stok masuk dan keluar."))
    elems.append(p("5. Data Transaksi Penjualan dan Pajak PB1: Data rekaman transaksi pemesanan meja yang memuat nomor nota unik, tautan nomor meja asal, nama pemesan, rincian daftar item menu, catatan khusus peracikan, nilai subtotal, kalkulasi pajak restoran PB1 (10%), biaya layanan, grand total, metode pembayaran (tunai atau QRIS Midtrans), dan status tahapan pesanan."))
    elems.append(p("6. Data Rekonsiliasi Kas Laci Kasir: Data pembukuan shift operasional kasir, meliputi pencatatan modal awal kas laci (starting cash), total akumulasi penjualan tunai sistem selama shift, input hitung fisik kas tunai aktual saat tutup shift, dan kalkulasi nilai selisih kas (difference) guna mencegah kebocoran kas."))
    elems.append(p("7. Data Rekam Jejak Audit: Data log pencatatan audit aktivitas staf (audit trail), memuat identitas pengguna, tipe aksi operasional (login, pembatalan pesanan, perubahan harga resep, tutup shift kasir), alamat IP perangkat, dan stempel waktu kejadian untuk keperluan investigasi keamanan."))
    
    # 3.1.2
    elems.append(heading("3.1.2  Peralatan Penelitian", level=3))
    elems.append(p("Peralatan yang digunakan dalam pelaksanaan penelitian rancang bangun sistem ini terdiri atas perangkat keras (hardware) dan perangkat lunak (software) dengan rincian spesifikasi pada tabel-tabel berikut:"))
    
    # Table 3.1 Hardware
    elems.append(caption("Tabel 3.1 Spesifikasi Perangkat Keras Penelitian", is_table=True))
    headers_3_1 = ["No", "Perangkat Keras", "Spesifikasi Teknis", "Fungsi / Kegunaan"]
    rows_3_1 = [
        ["1", "Komputer Pengembang", "Intel Core i7-12700H, RAM 16 GB DDR4, SSD 512 GB NVMe, Layar 15.6\" FHD", "Stasiun kerja utama untuk penulisan kode sumber, kompilasi, dan pengujian lokal"],
        ["2", "Ponsel Pintar Penguji A", "Xiaomi Redmi Note 11, RAM 6 GB, Layar AMOLED 6.43\", Kamera 50 MP, Android 13", "Pengujian pemindaian QR Code meja dan responsivitas web pemesanan pada Android"],
        ["3", "Ponsel Pintar Penguji B", "Apple iPhone 12, RAM 4 GB, Layar Super Retina XDR 6.1\", Kamera 12 MP, iOS 17", "Pengujian pemindaian QR Code kamera natif dan responsivitas Safari pada iOS"],
        ["4", "Perangkat Jaringan", "Wireless Router TP-Link Archer C6 AC1200 Dual-Band Gigabit Wi-Fi", "Infrastruktur jaringan komunikasi lokal antara klien seluler dan server web lokal"]
    ]
    widths_3_1 = [500, 2200, 3600, 3200]
    elems.append(table(headers_3_1, rows_3_1, widths_3_1))
    
    # Table 3.2 Software
    elems.append(caption("Tabel 3.2 Spesifikasi Perangkat Lunak Penelitian", is_table=True))
    headers_3_2 = ["No", "Perangkat Lunak", "Versi / Lingkungan", "Fungsi / Peran dalam Sistem"]
    rows_3_2 = [
        ["1", "Sistem Operasi", "Microsoft Windows 11 Pro 64-bit", "Sistem operasi utama lingkungan pengembangan perangkat lunak"],
        ["2", "Web Server Stack", "Laragon Development Environment (Apache, PHP, MySQL)", "Penyedia server lokal terpadu untuk eksekusi backend dan basis data"],
        ["3", "Runtime Language", "PHP versi 8.2 & Node.js versi 20.x LTS", "Mesin runtime eksekusi logika backend dan bundling pustaka front-end"],
        ["4", "Backend Framework", "Laravel versi 11.x (PHP)", "Kerangka kerja RESTful API, Eloquent ORM, dan manajemen autentikasi"],
        ["5", "Frontend Library", "React 18 dengan TypeScript & Vite", "Pustaka antarmuka Single Page Application (SPA) responsif dan terketik ketat"],
        ["6", "CSS Framework", "Tailwind CSS versi 4 & Lucide React", "Kerangka kerja styling antarmuka mobile-first dan ikonografi modern"],
        ["7", "Basis Data (DBMS)", "MySQL versi 8.0 Community Server", "Penyimpanan basis data relasional untuk katalog, meja, dan transaksi pesanan"],
        ["8", "Payment Gateway", "Midtrans Core API / Snap QRIS Sandbox", "Simulasi penerimaan pembayaran nontunai digital QRIS secara real-time"],
        ["9", "Code Editor & Tools", "Visual Studio Code, Git, Postman API Client", "Penyuntingan kode program, versi kontrol repositori, dan pengujian endpoint API"]
    ]
    widths_3_2 = [500, 2200, 3200, 3600]
    elems.append(table(headers_3_2, rows_3_2, widths_3_2))
    
    # 3.2 Prosedur dan Pengumpulan Data
    elems.append(heading("3.2  Prosedur dan Pengumpulan Data", level=2))
    elems.append(p("Prosedur pengumpulan data dilakukan secara terstruktur melalui tiga teknik pengumpulan data ilmiah guna memperoleh fakta empiris dan landasan teoritis yang akurat:"))
    
    # 3.2.1
    elems.append(heading("3.2.1  Observasi Operasional Lapangan (Field Observation)", level=3))
    elems.append(p("Teknik observasi langsung dilaksanakan dengan mengamati alur layanan pemesanan pada jam operasional gerai coffeeshop, khususnya pada jam sibuk (peak hours antara pukul 16.00 hingga 21.00 WIB). Fokus observasi mencakup: (a) pengukuran waktu tunggu pelanggan sejak datang hingga menerima pesanan, (b) frekuensi antrean yang menumpuk di meja kasir, (c) frekuensi terjadinya kesalahan pencatatan pesanan manual varian minuman oleh kasir, dan (d) alur komunikasi penyampaian tiket pesanan dari kasir ke meja barista dapur."))
    
    # 3.2.2
    elems.append(heading("3.2.2  Wawancara Mendalam (In-depth Interview)", level=3))
    elems.append(p("Wawancara terstruktur dilakukan dengan pihak-pihak yang terlibat langsung dalam proses bisnis gerai, meliputi: (a) Kasir, terkait kendala penginputan pesanan saat antrean panjang serta beban pencocokan kas fisik saat tutup shift; (b) Barista, mengenai kesulitan membaca tulisan tangan pada kertas nota pesanan dan ketiadaan urutan prioritas antrean racik; (c) Admin Gudang, mengenai kendala keterlambatan pencatatan sisa bahan baku; dan (d) Pemilik Toko (Owner), terkait kebutuhan pemantauan omzet penjualan riil, kepatuhan pajak restoran PB1 (10%), rata-rata transaksi belanja pelanggan, serta pencegahan selisih kas kasir."))
    
    # 3.2.3
    elems.append(heading("3.2.3  Studi Kepustakaan (Literature Review)", level=3))
    elems.append(p("Studi kepustakaan dilakukan dengan menelaah buku teks referensi rekayasa perangkat lunak, dokumentasi teknis resmi (Laravel, React, Tailwind CSS, Midtrans API), serta artikel jurnal ilmiah nasional bereputasi terakreditasi SINTA terkait implementasi QR Code, sistem antrean FIFO, dan perancangan arsitektur RESTful API."))
    
    # 3.3 Analisis Kebutuhan Sistem
    elems.append(heading("3.3  Analisis Kebutuhan Sistem", level=2))
    elems.append(p("Analisis kebutuhan sistem bertujuan untuk mendefinisikan seluruh kapabilitas layanan fungsional yang wajib disediakan oleh perangkat lunak serta batasan kualitas operasional sistem secara menyeluruh."))
    
    # 3.3.1
    elems.append(heading("3.3.1  Kebutuhan Fungsional (Functional Requirements)", level=3))
    elems.append(p("Kebutuhan fungsional sistem dimodelkan berdasarkan hak akses pengguna dengan menerapkan Role-Based Access Control (RBAC) yang membagi kewenangan ke dalam 5 peran staf serta 1 peran tamu pelanggan sebagaimana dirangkum pada Tabel 3.3."))
    
    # Table 3.3 RBAC Matrix
    elems.append(caption("Tabel 3.3 Matriks Kebutuhan Fungsional Pengguna Berdasarkan Peran RBAC", is_table=True))
    headers_3_3 = ["Peran Pengguna", "Hak Akses & Fungsionalitas Sistem yang Disediakan", "Batasan Akses"]
    rows_3_3 = [
        ["Pelanggan (Public / Tamu)", "Memindai QR Meja (Meja 01 s/d Meja 05), membuka katalog menu digital, memilih varian modifikasi rasa (es, gula, topping), menambahkan catatan per item, mengelola keranjang belanja, mengirimkan pesanan meja, dan memantau status pesanan secara waktu nyata.", "Tanpa perlu login akun; dibatasi hanya pada nomor meja yang dipindai."],
        ["Kasir (cashier)", "Membuka shift kas laci dengan input modal awal (starting cash), melayani transaksi langsung kasir (dine-in meja 01-05 atau bungkus takeaway), konfirmasi pembayaran tunai dan verifikasi QRIS, cetak struk nota transaksi, dan menutup shift kasir dengan input kas fisik aktual untuk rekonsiliasi.", "Tidak dapat mengubah master harga menu atau formula resep."],
        ["Barista (barista)", "Memantau layar Kitchen Display System (KDS) antrean dapur secara kronologis urut waktu masuk (FIFO), memperbarui status pengerjaan pesanan (Sedang Diracik -> Siap Saji), dan mengaktifkan sakelar darurat menu habis (sold-out).", "Hanya mengakses antarmuka antrean dapur barista."],
        ["Admin Gudang (warehouse_admin)", "Memantau saldo persediaan bahan baku secara real-time, mencatat penerimaan barang masuk manual (inbound), membuat draf pengadaan bahan (Purchase Order / PO) ke vendor rekanan, dan melakukan input stok opname fisik gudang.", "Tidak memiliki wewenang menyetujui transaksi penjualan kasir."],
        ["Store Manager (store_manager)", "Mengelola master data kategori dan katalog produk, mengatur formula takaran resep bahan baku per menu, mengelola master 5 meja dan mencetak lembar QR meja, menyetujui dokumen PO pengadaan gudang dan bahan rusak (waste), serta monitoring presensi karyawan.", "Mengelola seluruh operasional gerai di bawah pengawasan owner."],
        ["Pemilik Toko (Owner / super_admin)", "Memantau Dashboard Penjualan Terpusat (omzet kotor/bersih, penerimaan pajak restoran PB1 10%, total transaksi selesai, rata-rata transaksi AOV, top 5 menu terlaris, analisis jam ramai rush hours, rasio pembayaran QRIS vs Tunai), audit rekonsiliasi kas kasir per shift, dan meninjau seluruh log audit aktivitas staf.", "Akses level tertinggi; modul akuntansi berbelit ditiadakan."]
    ]
    widths_3_3 = [2000, 5200, 2300]
    elems.append(table(headers_3_3, rows_3_3, widths_3_3))
    
    # 3.3.2
    elems.append(heading("3.3.2  Kebutuhan Non-Fungsional (Non-Functional Requirements)", level=3))
    elems.append(p("Kebutuhan non-fungsional mendefinisikan atribut kualitas dan batasan teknis performa sistem:"))
    elems.append(p("1. Usability: Antarmuka pelanggan dirancang dengan pendekatan Mobile-First yang intuitif, tata letak ergonomis untuk pengoperasian satu tangan pada ponsel, serta kontras warna yang nyaman dipandang."))
    elems.append(p("2. Performance: Waktu respon pemuatan halaman awal aplikasi pemesanan mandiri tidak melebihi 2 detik pada koneksi internet seluler standar berkat pemanfaatan Single Page Application (SPA) berbasis Vite dan React 18."))
    elems.append(p("3. Security & Data Integrity: Parameter nomor meja dilindungi menggunakan token acak terverifikasi untuk mencegah manipulasi URL pesanan, autentikasi sesi staf menggunakan Laravel Sanctum Bearer Token, dan transaksi data penjualan mematuhi integritas ACID basis data."))
    elems.append(p("4. Portability & Compatibility: Aplikasi web responsif dapat diakses secara mulus melalui berbagai peramban modern (Google Chrome, Apple Safari, Mozilla Firefox) tanpa kendala ketidaksesuaian tata letak antarmuka."))
    
    # 3.4 Perancangan Sistem
    elems.append(heading("3.4  Perancangan Sistem", level=2))
    elems.append(p("Perancangan sistem menyajikan model visual alur logika bisnis, aliran data sistem informasi, struktur relasional data, dan tata letak antarmuka pengguna."))
    
    # 3.4.1 Flowchart
    elems.append(heading("3.4.1  Diagram Alir Sistem (Flowchart)", level=3))
    elems.append(p("Diagram alir sistem memodelkan urutan langkah logis yang dilalui oleh pelanggan dalam melakukan pemesanan mandiri menggunakan QR Code meja. Alur dimulai ketika pelanggan memindai stiker QR Code di meja (Meja 01 s/d Meja 05), sistem memvalidasi token meja, menampilkan menu aktif, pelanggan memilih menu dan varian modifikasi, memeriksa ringkasan keranjang belanja beserta rincian subtotal dan pajak PB1 (10%), lalu mengirimkan pesanan ke peladen untuk diteruskan secara instan ke layar KDS dapur barista berprinsip FIFO."))
    
    flowchart_desc = [
        "• Titik Mulai (Start): Pelanggan menduduki salah satu meja gerai (Meja 01 s/d Meja 05).",
        "• Proses 1: Pelanggan memindai stiker QR Code yang tertera pada meja menggunakan kamera ponsel.",
        "• Keputusan 1: Sistem memvalidasi token meja; jika token tidak valid, tampilkan pesan peringatan eror.",
        "• Proses 2: Jika valid, sistem memuat antarmuka katalog menu digital beserta kelompok kategori.",
        "• Proses 3: Pelanggan memilih menu, menentukan varian rasa (suhu, gula, susu), dan mengisi instruksi khusus.",
        "• Proses 4: Item pesanan dimasukkan ke dalam keranjang belanja digital (cart).",
        "• Proses 5: Pelanggan membuka keranjang, mengisi nama pemesan, dan sistem menghitung subtotal + PB1 10%.",
        "• Proses 6: Pelanggan menekan tombol konfirmasi pemesanan untuk mengirim payload JSON ke Laravel API.",
        "• Proses 7: Backend membuat record order, memotong stok resep bahan otomatis, dan menerbitkan invoice.",
        "• Proses 8: Pesanan muncul di antrean KDS dapur barista berurutan waktu (FIFO) dan kasir menerima notifikasi.",
        "• Titik Selesai (End): Pelanggan menerima nomor nota dan halaman beralih ke status pelacakan pesanan."
    ]
    elems.append(frame_diagram("Gambar 3.1 Flowchart Alur Pemesanan Mandiri Meja Menggunakan QR Code", "Diagram Alir Alur Kerja Aplikasi Pemesanan Mandiri Meja", flowchart_desc))
    elems.append(caption("Gambar 3.1 Flowchart Alur Pemesanan Mandiri Meja Menggunakan QR Code", is_table=False))
    
    # 3.4.2 DFD Level 0 (Diagram Konteks)
    elems.append(heading("3.4.2  Diagram Konteks (DFD Level 0)", level=3))
    elems.append(p("Diagram Konteks memodelkan batasan sistem secara makro dengan merepresentasikan keseluruhan aplikasi coffeeshop sebagai satu proses tunggal (Proses 0) yang berinteraksi dengan 7 entitas luar (external entities), yaitu: Pelanggan, Kasir, Barista, Admin Gudang, Store Manager, Owner, dan Gateway Pembayaran Midtrans."))
    
    dfd0_desc = [
        "• Entitas Pelanggan: Mengirimkan input pemindaian token meja, pemilihan menu & varian rasa, nama pemesan, dan instruksi khusus; menerima informasi katalog menu aktif, rincian biaya pesanan (subtotal + PB1 10%), nomor invoice, dan status pengerjaan pesanan.",
        "• Entitas Kasir: Mengirimkan data modal awal shift (starting cash), input pesanan langsung kasir, konfirmasi pembayaran kas, dan input kas fisik akhir shift; menerima daftar pesanan meja masuk, status pembayaran QRIS, dan lembar struk nota.",
        "• Entitas Barista: Mengirimkan pembaruan status pengerjaan racik (sedang diracik/selesai) dan sakelar darurat menu habis; menerima daftar antrean peracikan pesanan dapur berurut waktu masuk FIFO.",
        "• Entitas Admin Gudang: Mengirimkan data penerimaan barang masuk (inbound), draf pengadaan PO bahan, dan hasil opname fisik; menerima informasi saldo stok bahan real-time dan notifikasi bahan baku menipis.",
        "• Entitas Store Manager: Mengirimkan pengelolaan master kategori & menu, master formula resep, master 5 meja & cetak QR meja, serta persetujuan PO dan bahan rusak (waste); menerima laporan presensi karyawan dan rekap operasional gerai.",
        "• Entitas Pemilik Toko (Owner): Menerima laporan omzet penjualan riil, rekapitulasi penerimaan pajak restoran PB1 (10%), rata-rata transaksi belanja tamu (AOV), analisis top 5 menu terlaris, jam ramai rush hours, rekonsiliasi kas kasir per shift, dan seluruh log audit staf.",
        "• Entitas Midtrans Payment Gateway: Menerima permintaan pembuatan transaksi QRIS dinamis; mengirimkan notifikasi balik status pelunasan pembayaran nontunai (settlement webhook)."
    ]
    elems.append(frame_diagram("Gambar 3.2 Diagram Konteks (DFD Level 0) Sistem Pemesanan Coffeeshop", "public/diagrams/3_dfd_level_0_konteks.svg", dfd0_desc))
    elems.append(caption("Gambar 3.2 Diagram Konteks (DFD Level 0) Sistem Pemesanan Coffeeshop", is_table=False))
    
    # 3.4.3 DFD Level 1
    elems.append(heading("3.4.3  DFD Level 1 Dekomposisi Sistem", level=3))
    elems.append(p("DFD Level 1 mendekomposisi sistem pemesanan coffeeshop menjadi 7 proses operasional utama yang saling bertukar aliran data melalui 7 tempat penyimpanan data (data store) relasional:"))
    
    dfd1_desc = [
        "• Proses 1.0 (Pemesanan Mandiri Meja & Verifikasi QR): Memvalidasi token meja dari D1 (dining_tables), menyajikan katalog dari D5 (products & categories), serta menyimpan transaksi baru ke D2 (orders & order_items).",
        "• Proses 2.0 (Transaksi Kasir POS & Rekonsiliasi Kas Laci): Kasir mengelola pembukaan dan penutupan shift laci pada D6 (cashier_shifts), memproses pembayaran tunai/QRIS, serta memperbarui status pembayaran order pada D2.",
        "• Proses 3.0 (Antrean Peracikan Dapur Barista KDS FIFO): Barista mengambil antrean pesanan urut waktu (created_at ASC) dari D2 (orders & order_items) dan memperbarui status racik menjadi SIAP_SAJI.",
        "• Proses 4.0 (Pengurangan Stok Otomatis & Logistik Gudang): Setiap kali order terkonfirmasi pada D2, sistem membaca komposisi resep dari D3 (raw_materials & recipes) dan mencatat mutasi pengurangan persediaan ke D4 (stock_movements & purchase_orders).",
        "• Proses 5.0 (Pengelolaan Master Data & Formula Resep): Store manager mengelola master 5 meja pada D1, katalog produk pada D5, serta takaran resep bahan baku pada D3.",
        "• Proses 6.0 (Audit Trail & Rekonsiliasi Kasir): Mencatat seluruh aksi penting staf ke D6 (audit_logs & cashier_shifts) guna rekonsiliasi kas fisik dan deteksi selisih kas kasir.",
        "• Proses 7.0 (Pelaporan Eksekutif Penjualan & Pajak PB1): Mengagregasi data transaksi dari D2 dan D6 untuk disajikan kepada Owner dalam bentuk laporan omzet, pajak restoran PB1 (10%), AOV, dan jam ramai."
    ]
    elems.append(frame_diagram("Gambar 3.3 DFD Level 1 Dekomposisi Sistem Pemesanan dan Operasional", "public/diagrams/4_dfd_level_1.svg", dfd1_desc))
    elems.append(caption("Gambar 3.3 DFD Level 1 Dekomposisi Sistem Pemesanan dan Operasional", is_table=False))
    
    # 3.4.4 DFD Level 2
    elems.append(heading("3.4.4  DFD Level 2 Proses 1.0 Pemesanan Mandiri Pelanggan", level=3))
    elems.append(p("DFD Level 2 merupakan dekomposisi rinci dari Proses 1.0 (Pemesanan Mandiri Meja) yang memetakan empat subproses esensial saat pelanggan bertransaksi melalui pemindaian QR Code:"))
    
    dfd2_desc = [
        "• Subproses 1.1 (Verifikasi Token QR Meja): Menerima parameter kode token meja dari URL pemindaian pelanggan, mencocokkan dengan data store D1 (dining_tables), dan memastikan status meja dalam keadaan aktif (Meja 01 s/d Meja 05).",
        "• Subproses 1.2 (Penjelajahan Katalog & Seleksi Varian): Mengambil data produk aktif beserta opsi varian (suhu, gula, topping) dari D5 (products & categories) dan menyajikannya pada antarmuka peramban pelanggan.",
        "• Subproses 1.3 (Pengelolaan Keranjang & Kalkulasi Biaya): Menghitung kalkulasi subtotal item pesanan, penambahan pajak restoran PB1 sebesar 10%, biaya layanan jika dine-in, serta menampung instruksi catatan khusus pemesan.",
        "• Subproses 1.4 (Pembuatan Transaksi & Pengiriman ke Dapur FIFO): Menyimpan record order baru ke D2 (orders) dan rincian item ke D2 (order_items), sekaligus memicu pengurangan stok resep pada D3 (recipes) dan mengirimkan notifikasi antrean ke layar KDS barista."
    ]
    elems.append(frame_diagram("Gambar 3.4 DFD Level 2 Proses 1.0 Pemesanan Mandiri Pelanggan", "public/diagrams/5_dfd_level_2_pemesanan.svg", dfd2_desc))
    elems.append(caption("Gambar 3.4 DFD Level 2 Proses 1.0 Pemesanan Mandiri Pelanggan", is_table=False))
    
    # 3.4.5 ERD
    elems.append(heading("3.4.5  Entity Relationship Diagram (ERD)", level=3))
    elems.append(p("Entity Relationship Diagram (ERD) memodelkan arsitektur data konseptual sistem dengan menggambarkan 16 entitas inti yang saling berelasi. Relasi utama mencakup: DINING_TABLE yang memiliki relasi One-to-Many dengan ORDER; ORDER yang memiliki relasi One-to-Many dengan ORDER_ITEM; ORDER_ITEM yang memiliki relasi One-to-Many dengan ORDER_ITEM_MODIFIER; PRODUCT yang memiliki relasi Many-to-One dengan CATEGORY; PRODUCT yang memiliki relasi One-to-Many dengan RECIPE; RECIPE yang berelasi Many-to-One dengan RAW_MATERIAL; CASHIER_SHIFT yang memiliki relasi One-to-Many dengan ORDER; serta USER yang berelasi One-to-One dengan EMPLOYEE."))
    
    erd_desc = [
        "• DINING_TABLE (1) --- (N) ORDER: Satu meja (Meja 01 s/d Meja 05) dapat menampung banyak riwayat transaksi pesanan.",
        "• ORDER (1) --- (N) ORDER_ITEM: Satu transaksi order memuat banyak item menu yang dipesan pelanggan.",
        "• ORDER_ITEM (1) --- (N) ORDER_ITEM_MODIFIER: Satu item menu pesanan dapat memiliki banyak opsi kustomisasi rasa.",
        "• CATEGORY (1) --- (N) PRODUCT: Satu kelompok kategori mengelompokkan banyak produk makanan/minuman.",
        "• PRODUCT (1) --- (N) RECIPE: Satu produk menu memiliki beberapa formula takaran bahan baku peracikan.",
        "• RAW_MATERIAL (1) --- (N) RECIPE: Satu bahan mentah dapat menjadi komponen formula dari berbagai menu sajian.",
        "• RAW_MATERIAL (1) --- (N) STOCK_MOVEMENT: Satu bahan baku mencatat riwayat kartu mutasi masuk dan keluar.",
        "• SUPPLIER (1) --- (N) PURCHASE_ORDER: Satu rekanan supplier dapat menerima banyak pengajuan pengadaan bahan baku.",
        "• USER (1) --- (1) EMPLOYEE: Satu akun login staf terikat pada satu identitas profil data induk karyawan.",
        "• CASHIER_SHIFT (1) --- (N) ORDER: Satu sesi shift kasir menaungi seluruh transaksi penjualan tunai dan QRIS.",
        "• USER (1) --- (N) AUDIT_LOG: Seluruh aktivitas operasional staf dicatat dalam log audit pengawasan sistem."
    ]
    elems.append(frame_diagram("Gambar 3.5 Entity Relationship Diagram (ERD) Sistem Coffeeshop", "public/diagrams/2_erd_coffeeshop.svg", erd_desc))
    elems.append(caption("Gambar 3.5 Entity Relationship Diagram (ERD) Sistem Coffeeshop", is_table=False))
    
    # 3.4.6 Perancangan Basis Data Relasional Fisik
    elems.append(heading("3.4.6  Perancangan Basis Data Relasional Fisik", level=3))
    elems.append(p("Perancangan fisik basis data merinci struktur skema tabel, tipe data kolom, batasan (constraints), serta kunci relasi yang diimplementasikan pada MySQL 8.0 berdasarkan 16 tabel relasional aktif. Diagram struktur basis data fisik disajikan pada Gambar 3.6."))
    
    db_struct_desc = [
        "• Modul Meja & Transaksi: Terdiri atas tabel dining_tables (Meja 01-05), orders, order_items, dan order_item_modifiers.",
        "• Modul Menu & Formula Resep: Terdiri atas tabel categories, products, recipes, raw_materials, dan modifiers.",
        "• Modul Logistik & Pengadaan: Terdiri atas tabel stock_movements, purchase_orders, dan suppliers.",
        "• Modul SDM & Audit Keamanan: Terdiri atas tabel users, employees, cashier_shifts, dan audit_logs."
    ]
    elems.append(frame_diagram("Gambar 3.6 Struktur Basis Data Fisik Relasional Sistem Coffeeshop", "public/diagrams/1_struktur_database.svg", db_struct_desc))
    elems.append(caption("Gambar 3.6 Struktur Basis Data Fisik Relasional Sistem Coffeeshop", is_table=False))
    
    # Tables 3.4 to 3.19
    table_defs = [
        ("Tabel 3.4 Struktur Tabel dining_tables (Master 5 Meja Utama)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik meja (Auto Increment)"],
            ["2", "table_number", "VARCHAR(20)", "-", "Kode nomor meja unik (TB-01 s/d TB-05)"],
            ["3", "capacity", "INT", "-", "Kapasitas tempat duduk kursi meja (2, 4, 6)"],
            ["4", "status", "ENUM('AVAILABLE','OCCUPIED')", "-", "Status ketersediaan meja pelanggan"],
            ["5", "qr_token", "VARCHAR(64)", "-", "Token unik UUID untuk pembangkitan QR Code meja"],
            ["6", "created_at / updated_at", "TIMESTAMP", "-", "Stempel waktu pembuatan dan pembaruan data"]
        ]),
        ("Tabel 3.5 Struktur Tabel categories (Kelompok Kategori Menu)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik kategori (Auto Increment)"],
            ["2", "name", "VARCHAR(100)", "-", "Nama kelompok kategori (Coffee, Non-Coffee, dll)"],
            ["3", "slug", "VARCHAR(100)", "-", "Pengenal ramah URL untuk filter kategori"],
            ["4", "display_order", "INT", "-", "Urutan tampilan kategori pada antarmuka web"],
            ["5", "is_active", "BOOLEAN", "-", "Status keaktifan kategori produk"]
        ]),
        ("Tabel 3.6 Struktur Tabel products (Katalog Produk Menu)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik produk menu"],
            ["2", "category_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke tabel categories.id"],
            ["3", "name", "VARCHAR(150)", "-", "Nama produk minuman atau makanan"],
            ["4", "description", "TEXT", "-", "Deskripsi rasa dan komposisi produk"],
            ["5", "base_price", "DECIMAL(12,2)", "-", "Harga jual dasar satuan sebelum modifikasi varian"],
            ["6", "image_url", "VARCHAR(255)", "-", "Tautan path berkas gambar visual produk"],
            ["7", "is_available", "BOOLEAN", "-", "Status ketersediaan produk (true/false)"]
        ]),
        ("Tabel 3.7 Struktur Tabel recipes (Formula Takaran Resep Bahan Baku)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik formula resep menu"],
            ["2", "product_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke tabel products.id"],
            ["3", "raw_material_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke tabel raw_materials.id"],
            ["4", "quantity_needed", "DECIMAL(10,2)", "-", "Takaran kuantitas bahan yang dibutuhkan per porsi"],
            ["5", "unit", "VARCHAR(20)", "-", "Satuan takaran (gram, ml, pcs)"]
        ]),
        ("Tabel 3.8 Struktur Tabel raw_materials (Persediaan Bahan Baku Gudang)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik bahan baku gudang"],
            ["2", "name", "VARCHAR(150)", "-", "Nama bahan baku (kopi espresso, susu, sirup, cup)"],
            ["3", "current_stock", "DECIMAL(12,2)", "-", "Saldo kuantitas fisik persediaan saat ini"],
            ["4", "unit", "VARCHAR(20)", "-", "Satuan fisik baku (gram, ml, unit)"],
            ["5", "minimum_stock", "DECIMAL(10,2)", "-", "Batas kuantitas minimum peringatan pengadaan"]
        ]),
        ("Tabel 3.9 Struktur Tabel stock_movements (Kartu Mutasi Stok Bahan)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik baris mutasi stok"],
            ["2", "raw_material_id", "BIGINT UNSIGNED", "FK", "Relasi ke bahan baku yang mengalami mutasi"],
            ["3", "type", "ENUM('IN','OUT_SALE','WASTE')", "-", "Tipe aliran mutasi persediaan"],
            ["4", "quantity", "DECIMAL(10,2)", "-", "Jumlah kuantitas bahan yang bertambah/berkurang"],
            ["5", "reference_id", "VARCHAR(64)", "-", "Nomor referensi order nota atau invoice pengadaan"]
        ]),
        ("Tabel 3.10 Struktur Tabel orders (Transaksi Penjualan)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik transaksi order"],
            ["2", "invoice_number", "VARCHAR(50)", "-", "Nomor nota transaksi resmi (misal: INV-2026-0001)"],
            ["3", "dining_table_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke meja (NULL jika takeaway)"],
            ["4", "cashier_shift_id", "BIGINT UNSIGNED", "FK", "Relasi ke sesi shift kasir penanggung jawab"],
            ["5", "customer_name", "VARCHAR(100)", "-", "Nama pemesan yang diinput saat checkout"],
            ["6", "subtotal", "DECIMAL(12,2)", "-", "Akumulasi harga item menu sebelum pajak"],
            ["7", "tax_amount", "DECIMAL(12,2)", "-", "Nilai pajak restoran PB1 (10% dari subtotal)"],
            ["8", "total_amount", "DECIMAL(12,2)", "-", "Total nominal akhir pembayaran transaksi"],
            ["9", "payment_method", "ENUM('CASH','QRIS')", "-", "Metode pembayaran yang dipilih pelanggan/kasir"],
            ["10", "payment_status", "ENUM('UNPAID','PAID')", "-", "Status pelunasan pembayaran transaksi"],
            ["11", "order_status", "VARCHAR(30)", "-", "Status alur (PENDING, IN_PROGRESS, READY, COMPLETED)"]
        ]),
        ("Tabel 3.11 Struktur Tabel order_items (Rincian Item Menu Pesanan)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik rincian item pesanan"],
            ["2", "order_id", "BIGINT UNSIGNED", "FK", "Relasi ke transaksi induk orders.id"],
            ["3", "product_id", "BIGINT UNSIGNED", "FK", "Relasi ke produk menu products.id"],
            ["4", "qty", "INT", "-", "Jumlah kuantitas unit produk yang dipesan"],
            ["5", "unit_price", "DECIMAL(12,2)", "-", "Harga dasar satuan produk saat transaksi"],
            ["6", "subtotal", "DECIMAL(12,2)", "-", "Total harga item (qty dikalikan unit_price)"],
            ["7", "notes", "VARCHAR(255)", "-", "Instruksi peracikan khusus pelanggan"]
        ]),
        ("Tabel 3.12 Struktur Tabel modifiers (Opsi Pilihan Modifikasi Menu)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik opsi modifier"],
            ["2", "name", "VARCHAR(100)", "-", "Nama opsi varian (Less Sugar, Extra Shot, Oatmilk)"],
            ["3", "extra_price", "DECIMAL(10,2)", "-", "Tambahan nominal harga jual varian"],
            ["4", "is_active", "BOOLEAN", "-", "Status keaktifan opsi varian"]
        ]),
        ("Tabel 3.13 Struktur Tabel order_item_modifiers (Rincian Modifikasi Item)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik rincian modifikasi"],
            ["2", "order_item_id", "BIGINT UNSIGNED", "FK", "Relasi ke item pesanan order_items.id"],
            ["3", "modifier_id", "BIGINT UNSIGNED", "FK", "Relasi ke opsi varian modifiers.id"],
            ["4", "extra_price", "DECIMAL(10,2)", "-", "Nominal biaya tambahan saat transaksi dicatat"]
        ]),
        ("Tabel 3.14 Struktur Tabel cashier_shifts (Pencatatan Shift Kas Laci Kasir)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik sesi shift kasir"],
            ["2", "user_id", "BIGINT UNSIGNED", "FK", "Relasi ke akun staf kasir yang bertugas"],
            ["3", "shift_name", "VARCHAR(50)", "-", "Nama sesi kerja (Shift Pagi / Shift Sore)"],
            ["4", "starting_cash", "DECIMAL(12,2)", "-", "Modal uang tunai awal dalam laci kasir"],
            ["5", "expected_cash", "DECIMAL(12,2)", "-", "Saldo kas yang seharusnya ada berdasarkan sistem"],
            ["6", "actual_cash", "DECIMAL(12,2)", "-", "Penghitungan fisik kas aktual saat tutup shift"],
            ["7", "difference", "DECIMAL(12,2)", "-", "Nilai selisih kas fisik terhadap catatan sistem"],
            ["8", "status", "ENUM('OPEN','CLOSED')", "-", "Status keaktifan sesi shift kasir"]
        ]),
        ("Tabel 3.15 Struktur Tabel suppliers (Data Rekanan Vendor Bahan Baku)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik supplier"],
            ["2", "name", "VARCHAR(150)", "-", "Nama instansi/perusahaan rekanan vendor"],
            ["3", "contact_person", "VARCHAR(100)", "-", "Nama narahubung penyedia bahan baku"],
            ["4", "phone", "VARCHAR(30)", "-", "Nomor telepon kontak rekanan"],
            ["5", "address", "TEXT", "-", "Alamat fisik lokasi vendor rekanan"]
        ]),
        ("Tabel 3.16 Struktur Tabel purchase_orders (Dokumen Pengadaan Gudang)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik berkas Purchase Order"],
            ["2", "po_number", "VARCHAR(50)", "-", "Nomor nota pengadaan (PO-2026-XXXX)"],
            ["3", "supplier_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke tabel suppliers.id"],
            ["4", "total_amount", "DECIMAL(12,2)", "-", "Total nominal pengadaan bahan baku"],
            ["5", "status", "ENUM('DRAFT','APPROVED','DELIVERED')", "-", "Status tahapan pengadaan bahan"]
        ]),
        ("Tabel 3.17 Struktur Tabel users (Akun Login Pengguna Sistem)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik akun login pengguna"],
            ["2", "name", "VARCHAR(100)", "-", "Nama lengkap akun pengguna"],
            ["3", "email", "VARCHAR(100)", "-", "Alamat email unik untuk kredensial login"],
            ["4", "password", "VARCHAR(255)", "-", "Kata sandi akun terenkripsi hash bcrypt"],
            ["5", "role", "VARCHAR(30)", "-", "Peran hak akses (cashier, barista, manager, owner)"]
        ]),
        ("Tabel 3.18 Struktur Tabel employees (Profil Induk Karyawan)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik profil karyawan"],
            ["2", "user_id", "BIGINT UNSIGNED", "FK", "Relasi kunci tamu ke akun users.id"],
            ["3", "employee_code", "VARCHAR(30)", "-", "Nomor induk karyawan (NIK unik)"],
            ["4", "position", "VARCHAR(50)", "-", "Nama jabatan/posisi operasional kerja"],
            ["5", "phone", "VARCHAR(30)", "-", "Nomor telepon kontak karyawan"]
        ]),
        ("Tabel 3.19 Struktur Tabel audit_logs (Rekam Jejak Aktivitas Sistem)", ["No", "Nama Kolom (Field)", "Tipe Data", "Kunci", "Keterangan"], [
            ["1", "id", "BIGINT UNSIGNED", "PK", "Pengenal unik baris catatan audit"],
            ["2", "user_id", "BIGINT UNSIGNED", "FK", "Relasi ke pengguna yang melakukan tindakan"],
            ["3", "action", "VARCHAR(100)", "-", "Deskripsi aksi operasional yang dieksekusi"],
            ["4", "ip_address", "VARCHAR(45)", "-", "Alamat IP perangkat komputer/ponsel pelaku"],
            ["5", "user_agent", "TEXT", "-", "Informasi tipe peramban dan sistem operasi"],
            ["6", "created_at", "TIMESTAMP", "-", "Stempel waktu presisi eksekusi tindakan"]
        ])
    ]
    
    for tbl_title, hdrs, rws in table_defs:
        elems.append(caption(tbl_title, is_table=True))
        w_col = [600, 2400, 2200, 800, 3500]
        elems.append(table(hdrs, rws, w_col))
        
    # 3.4.7 Perancangan Antarmuka Pengguna
    elems.append(heading("3.4.7  Perancangan Antarmuka Pengguna (User Interface)", level=3))
    elems.append(p("Perancangan antarmuka pengguna mengadopsi prinsip desain human-centered dan pendekatan Mobile-First untuk menghadirkan pengalaman navigasi yang intuitif. Delapan rancangan antarmuka utama sistem diuraikan sebagai berikut:"))
    
    mockups = [
        ("Gambar 3.7 Rancangan Layar Sambutan dan Verifikasi QR Meja", "Tangkapan Layar Antarmuka CustomerOrder.tsx (Rute: /order/table/TB-01)", [
            "• Elemen Visual: Header identitas gerai coffeeshop, kartu status verifikasi nomor meja (Meja 01 s/d Meja 05), dan tombol aksi 'Buka Buku Menu'.",
            "• Fungsi: Memvalidasi parameter token meja dari kamera ponsel dan memastikan pelanggan berada di meja yang sah."
        ]),
        ("Gambar 3.8 Rancangan Layar Katalog Menu Digital dan Kategori Produk", "Tangkapan Layar Antarmuka Katalog Menu pada Perangkat Ponsel", [
            "• Elemen Visual: Bilah pencarian nama menu, tab navigasi horizontal kategori produk (Semua, Coffee, Non-Coffee, Pastry, Meals), serta kartu produk dengan foto, deskripsi singkat, dan harga dasar.",
            "• Fungsi: Memudahkan pelanggan menelusuri menu secara visual dan responsif."
        ]),
        ("Gambar 3.9 Rancangan Modal Kustomisasi Varian Rasa dan Catatan Khusus", "Tangkapan Layar Modal Opsi Varian Produk (CustomerOrder.tsx)", [
            "• Elemen Visual: Pilihan opsi suhu (Hot / Iced), tingkat kemanisan (Normal, Less Sugar, No Sugar), pilihan susu alternatif, kolom input catatan instruksi barista, dan tombol 'Tambah ke Pesanan'.",
            "• Fungsi: Mengakomodasi preferensi personal pelanggan pada setiap menu yang dipesan."
        ]),
        ("Gambar 3.10 Rancangan Layar Keranjang Belanja dan Rincian Biaya", "Tangkapan Layar Antarmuka Keranjang Pesanan Mandiri & Kalkulasi Subtotal PB1", [
            "• Elemen Visual: Daftar item terpilih dengan tombol kontrol kuantitas (+ / -), kolom input nama pemesan, rincian hitung subtotal, pajak restoran PB1 (10%), biaya layanan dine-in, dan tombol konfirmasi 'Kirim Pesanan'.",
            "• Fungsi: Memastikan akurasi rincian pesanan dan kalkulasi biaya sebelum dikirimkan ke dapur."
        ]),
        ("Gambar 3.11 Rancangan Antarmuka Terminal Kasir POS dan Shift Laci Kas", "Tangkapan Layar Modul CashierPos.tsx (Terminal Kasir & Shift Modal)", [
            "• Elemen Visual: Modal input modal awal kas (starting cash), grid menu kasir, pemilih 5 meja (Meja 01-05 atau Takeaway), tombol bayar tunai / cetak nota, dan tombol tutup shift rekonsiliasi kas fisik.",
            "• Fungsi: Melayani transaksi langsung di meja kasir dan mengaudit arus kas fisik kasir per shift."
        ]),
        ("Gambar 3.12 Rancangan Antarmuka Dapur Barista (Kitchen Display System FIFO)", "Tangkapan Layar Modul BaristaKds.tsx (Layar Dapur Barista)", [
            "• Elemen Visual: Kolom kartu antrean pesanan urut waktu (First-In, First-Out), indikator waktu tunggu dalam menit, daftar item beserta varian dan catatan khusus, serta tombol status pengerjaan racik.",
            "• Fungsi: Menjaga ketertiban dan kecepatan kerja barista dapur secara kronologis."
        ]),
        ("Gambar 3.13 Rancangan Antarmuka Pengelolaan Gudang dan Purchase Order", "Tangkapan Layar Modul WarehouseInventory.tsx (Gudang & PO Pengadaan)", [
            "• Elemen Visual: Tabel persediaan bahan baku real-time, lencana peringatan batas stok minimum, tombol input barang masuk manual, dan formulir pengajuan PO pengadaan bahan ke rekanan supplier.",
            "• Fungsi: Memantau sisa bahan baku dan mempermudah pengadaan logistik gerai."
        ]),
        ("Gambar 3.14 Rancangan Antarmuka Dashboard Penjualan dan Rekonsiliasi Kasir Owner", "Tangkapan Layar Modul OwnerDashboard.tsx (Dashboard Pemilik)", [
            "• Elemen Visual: Kartu KPI omzet penjualan riil, penerimaan pajak restoran PB1 (10%), total transaksi selesai, rata-rata belanja tamu (AOV), grafik tren transaksi jam sibuk (rush hours), top 5 menu terlaris, dan tabel audit rekonsiliasi kas kasir per shift.",
            "• Fungsi: Memberikan ringkasan eksekutif performa finansial gerai yang bersih dari modul akuntansi rumit."
        ])
    ]
    
    for cap, f_src, desc_lines in mockups:
        elems.append(frame_diagram(cap, f_src, desc_lines))
        elems.append(caption(cap, is_table=False))
        
    return elems

def get_daftar_pustaka_elements():
    """
    Returns 11 verified real academic references strictly formatted according to UTDI Name-Year style.
    """
    refs = [
        "Hidayat, T., dan M. Muttaqin. 2020. Pengujian Sistem Informasi Berbasis Web dengan Metode Black Box Testing Equivalence Partitions. Jurnal Sisfokom (Sistem Informasi dan Komputer) 9(3): 400–408.",
        "Kendall, K. E., dan J. E. Kendall. 2014. Systems Analysis and Design. 9th ed. Pearson Education, Boston.",
        "Kurniawan, R., dan O. M. Febriani. 2022. Penerapan Model View Controller (MVC) pada Rancang Bangun Sistem Informasi Kasir Menggunakan Framework Laravel. Jurnal Informatika dan Rekayasa Perangkat Lunak 3(2): 178–186.",
        "Nurhadi, A., dan A. Salam. 2022. Penerapan Framework Laravel pada Rancang Bangun Sistem Informasi Penjualan Coffee Shop Berbasis Web. Jurnal Teknologi Sistem Informasi 3(1): 112–123.",
        "O'Brien, J. A., dan G. M. Marakas. 2017. Management Information Systems. 10th ed. McGraw-Hill Education, New York.",
        "Pratama, E. B., dan A. Hendini. 2019. Rancang Bangun Sistem Informasi Pemesanan Makanan dan Minuman Berbasis Web Menggunakan QR Code. Jurnal Khatulistiwa Informatika 7(2): 101–107.",
        "Pressman, R. S., dan B. R. Maxim. 2020. Software Engineering: A Practitioner's Approach. 9th ed. McGraw-Hill Education, New York.",
        "Santoso, B., dan R. Wulandari. 2023. Rancang Bangun Sistem Informasi Point of Sale (POS) Berbasis Web Menggunakan Framework Laravel pada Coffee Shop. Jurnal Rekayasa Informasi 12(2): 88–96.",
        "Saputra, A. 2020. Penerapan Konsep FIFO pada Sistem Antrean Pesanan Dapur Restoran Berbasis Web. Jurnal Tekno Kompak 14(1): 22–27.",
        "Setiawan, A., dan D. Kurniawan. 2021. Implementasi Quick Response Code (QR Code) Pada Sistem Pemesanan Menu Restoran Berbasis Web. Jurnal Algoritma, Logika dan Komputasi 4(1): 45–52.",
        "Wijaya, H., dan S. Rahardjo. 2021. Perancangan Sistem Pemesanan Mandiri Meja Menggunakan Quick Response Code untuk Mengurangi Waktu Tunggu Pelanggan. Jurnal Ilmiah Komputasi 20(3): 315–324."
    ]
    
    elems = []
    for ref in sorted(refs):
        elems.append(p(ref, indent_first=False, space_after=120, space_line=360))
    return elems

print("Enhanced thesis_content_bab3 ready.")
