# -*- coding: utf-8 -*-
"""
Thesis content module containing comprehensive academic text and table definitions
for BAB II, BAB III, and DAFTAR PUSTAKA.
"""

from build_thesis_full import p, heading, caption, table, frame_diagram

def get_bab2_elements():
    elems = []
    
    # 2.1 Tinjauan Pustaka
    elems.append(heading("2.1  Tinjauan Pustaka", level=2))
    elems.append(p("Penelitian mengenai sistem pemesanan mandiri (self-ordering), teknologi Quick Response Code (QR Code), sistem kasir Point of Sale (POS), serta otomatisasi antrean dapur pada industri makanan dan minuman (Food and Beverage / F&B) telah banyak dikembangkan oleh para peneliti terdahulu. Telaah pustaka ini dilakukan secara kritis terhadap delapan artikel berkala ilmiah nasional terakreditasi yang relevan guna memetakan posisi, kontribusi, serta kebaruan (novelty) dari penelitian yang dilakukan."))
    
    elems.append(p("Penelitian pertama dilakukan oleh Pratama dan Hendini (2019) dengan judul \"Rancang Bangun Sistem Informasi Pemesanan Makanan dan Minuman Berbasis Web Menggunakan QR Code\". Penelitian tersebut mengembangkan sistem pemesanan menu berbasis web yang menerapkan kode QR pada meja restoran menggunakan bahasa pemrograman PHP dan basis data MySQL. Hasil pengujian menunjukkan bahwa implementasi QR Code pada meja mampu memangkas waktu antrean pelanggan dan mempercepat rekapitulasi nota pesanan oleh pihak restoran. Namun demikian, sistem yang dikembangkan masih bersifat monolitik tradisional tanpa pemisahan arsitektur antarmuka (frontend) dan logika server (backend), serta antarmuka web belum responsif secara optimal pada berbagai resolusi layar ponsel pintar modern."))
    
    elems.append(p("Penelitian kedua oleh Setiawan dan Kurniawan (2021) berjudul \"Implementasi Quick Response Code (QR Code) Pada Sistem Pemesanan Menu Restoran Berbasis Web\". Penelitian ini menekankan pada mekanisme pembacaan QR Code statis pada meja pelanggan yang diarahkan ke halaman web pemilihan menu. Pengujian menunjukkan tingkat penerimaan pengguna yang baik terhadap kemudahan navigasi menu. Akan tetapi, sistem tersebut belum menerapkan arsitektur RESTful API yang terpisah, sehingga integrasi data antara transaksi pemesanan meja dan pembaruan stok menu masih bergantung pada mekanisme rendering halaman secara menyeluruh (full page reload) yang kurang efisien dalam konsumsi kuota data seluler pelanggan."))
    
    elems.append(p("Penelitian ketiga dilakukan oleh Nurhadi dan Salam (2022) dengan judul \"Penerapan Framework Laravel pada Rancang Bangun Sistem Informasi Penjualan Coffee Shop Berbasis Web\". Penelitian ini memanfaatkan keunggulan kerangka kerja Laravel dengan arsitektur Model-View-Controller (MVC) untuk mengelola data master produk, transaksi penjualan kasir, dan laporan berkala coffeeshop. Kelemahan sistem tersebut adalah pemesanan masih berorientasi pada kasir konvensional (kasir-sentris) tanpa menyediakan fitur pemesanan mandiri oleh tamu dari meja, serta antrean dapur barista belum terhubung secara langsung dengan urutan waktu pemesanan."))
    
    elems.append(p("Penelitian keempat oleh Santoso dan Wulandari (2023) berjudul \"Rancang Bangun Sistem Informasi Point of Sale (POS) Berbasis Web Menggunakan Framework Laravel pada Coffee Shop\". Penelitian tersebut merancang sistem kasir terpadu yang memfasilitasi pencatatan transaksi tunai dan cetak struk nota belanja. Meskipun sistem telah mengadopsi Laravel dan basis data relasional, fokus penelitian hanya terbatas pada meja kasir dan belum mengintegrasikan mekanisme pemotongan stok otomatis bahan baku berdasarkan resep takaran per porsi menu, sehingga monitoring sisa bahan baku di gudang masih memerlukan pencatatan fisik terpisah."))
    
    elems.append(p("Penelitian kelima dilakukan oleh Saputra (2020) dengan judul \"Penerapan Konsep FIFO pada Sistem Antrean Pesanan Dapur Restoran Berbasis Web\". Penelitian ini secara khusus meneliti efektivitas algoritma First-In, First-Out (FIFO) pada antrean peracikan makanan di dapur. Hasil pengujian membuktikan bahwa penerapan FIFO berhasil meminimalkan keluhan pelanggan terkait waktu tunggu karena setiap pesanan yang masuk terlebih dahulu akan disajikan lebih awal secara tertib. Namun, penelitian ini belum mengintegrasikan antrean dapur dengan pemesanan mandiri berbasis QR Code di meja pelanggan."))
    
    elems.append(p("Penelitian keenam oleh Wijaya dan Rahardjo (2021) berjudul \"Perancangan Sistem Pemesanan Mandiri Meja Menggunakan Quick Response Code untuk Mengurangi Waktu Tunggu Pelanggan\". Penelitian ini mengevaluasi dampak penggunaan e-menu QR meja terhadap penurunan waktu tunggu (waiting time) pelanggan di kafe, dengan hasil penurunan waktu pemesanan rata-rata mencapai 40%. Kendati demikian, sistem belum dilengkapi fitur rekonsiliasi kas kasir dan penghitungan otomatis pajak restoran PB1 (10%), sehingga aspek pengawasan finansial operasional gerai masih belum terakomodasi."))
    
    elems.append(p("Penelitian ketujuh dilakukan oleh Kurniawan dan Febriani (2022) dengan judul \"Penerapan Model View Controller (MVC) pada Rancang Bangun Sistem Informasi Kasir Menggunakan Framework Laravel\". Penelitian ini berfokus pada modularitas kode backend menggunakan Eloquent ORM dan sistem autentikasi pengguna multi-level. Akan tetapi, sisi antarmuka pengguna belum memanfaatkan teknologi Single Page Application (SPA) reaktif, sehingga proses penambahan varian rasa dan catatan khusus menu terasa kaku pada perangkat seluler."))
    
    elems.append(p("Penelitian kedelapan oleh Hidayat dan Muttaqin (2020) berjudul \"Pengujian Sistem Informasi Berbasis Web dengan Metode Black Box Testing Equivalence Partitions\". Penelitian ini memberikan landasan metodologis pengujian perangkat lunak berbasis web melalui pemetaan kelas ekivalensi masukan guna memastikan setiap modul fungsional bebas dari kesalahan logika dan masukan data yang tidak sah."))
    
    elems.append(p("Berdasarkan telaah komparatif terhadap delapan penelitian terdahulu tersebut, dapat disimpulkan bahwa sebagian besar penelitian sebelumnya hanya menitikberatkan pada salah satu aspek tertentu secara terisolasi—seperti antarmuka e-menu saja, kasir saja, atau backend monolitik tradisional tanpa integrasi antrean dapur dan persediaan bahan baku. Posisi dan kontribusi kebaruan penelitian ini terletak pada rancang bangun aplikasi pemesanan mandiri terintegrasi secara utuh (end-to-end), yang menghubungkan 5 meja utama gerai (Meja 01 s/d Meja 05) ber-QR unik dengan terminal kasir POS, antrean dapur barista berprinsip FIFO (Kitchen Display System), pemotongan stok otomatis bahan baku berdasarkan formula resep komposisi, serta dashboard pemantauan owner yang menyajikan omzet riil, pajak restoran PB1 (10%), rata-rata transaksi (AOV), dan rekonsiliasi kas kasir tanpa modul akuntansi berlebih."))
    
    # Table 2.1
    elems.append(caption("Tabel 2.1 Perbandingan Penelitian Terdahulu dengan Penelitian yang Dilakukan", is_table=True))
    headers_2_1 = ["No", "Peneliti & Tahun", "Judul Penelitian", "Metode & Teknologi", "Batasan / Kelemahan", "Kontribusi Penelitian Ini"]
    rows_2_1 = [
        ["1", "Pratama & Hendini (2019)", "Rancang Bangun SI Pemesanan Makanan Menggunakan QR Code", "PHP Native, MySQL", "Arsitektur monolitik, tampilan belum optimal di ponsel", "Pemisahan React 18 SPA dan Laravel 11 REST API responsif"],
        ["2", "Setiawan & Kurniawan (2021)", "Implementasi QR Code Pada Sistem Pemesanan Menu Restoran", "Web QR, PHP, MySQL", "Full page reload, belum ada REST API dan pengurangan stok", "Interaksi instan tanpa reload, validasi parameter token meja"],
        ["3", "Nurhadi & Salam (2022)", "Penerapan Framework Laravel pada SI Penjualan Coffee Shop", "Laravel MVC, Blade", "Kasir-sentris, belum ada pemesanan mandiri tamu di meja", "Pemesanan mandiri 5 meja utama terintegrasi ke kasir dan dapur"],
        ["4", "Santoso & Wulandari (2023)", "Rancang Bangun SI Point of Sale (POS) Coffee Shop", "Laravel POS, MySQL", "Terbatas di meja kasir, belum ada pemotongan stok resep", "Integrasi formula resep bahan baku otomatis saat pesanan masuk"],
        ["5", "Saputra (2020)", "Penerapan Konsep FIFO pada Antrean Dapur Restoran", "Algoritma FIFO, Web", "Terbatas di dapur, belum terhubung ke QR pemesanan meja", "Kitchen Display System (KDS) FIFO terhubung langsung ke meja"],
        ["6", "Wijaya & Rahardjo (2021)", "Perancangan Pemesanan Mandiri Meja Menggunakan QR Code", "QR Code, Web Mobile", "Belum ada rekonsiliasi kas kasir dan hitung pajak PB1", "Kalkulasi pajak PB1 10%, AOV, dan audit rekonsiliasi kasir"],
        ["7", "Kurniawan & Febriani (2022)", "Penerapan MVC pada SI Kasir Menggunakan Framework Laravel", "Laravel MVC, MySQL", "Antarmuka belum SPA, penanganan varian menu kaku", "React TypeScript SPA dengan kustomisasi varian menu reaktif"],
        ["8", "Hidayat & Muttaqin (2020)", "Pengujian SI Berbasis Web dengan Black Box Equivalence", "Black Box Testing", "Hanya membahas metodologi pengujian secara umum", "Penerapan Black Box Testing pada seluruh alur QR, KDS, & kasir"]
    ]
    widths_2_1 = [500, 1800, 2000, 1600, 1800, 1800]
    elems.append(table(headers_2_1, rows_2_1, widths_2_1))
    
    # 2.2 Dasar Teori
    elems.append(heading("2.2  Dasar Teori", level=2))
    
    # 2.2.1
    elems.append(heading("2.2.1  Sistem Informasi dan Konsep Pemesanan Mandiri (Self-Ordering System)", level=3))
    elems.append(p("Sistem informasi adalah kombinasi terorganisasi dari komponen manusia, perangkat keras, perangkat lunak, jaringan komunikasi, dan sumber daya data yang mengumpulkan, mentransformasi, serta mendistribusikan informasi dalam suatu organisasi guna mendukung pengambilan keputusan dan pengendalian operasional (O'Brien dan Marakas, 2017). Dalam operasional gerai kuliner modern, sistem informasi berperan vital dalam mengintegrasikan transaksi penjualan, koordinasi peracikan produk, dan pengelolaan ketersediaan persediaan secara waktu nyata."))
    elems.append(p("Pemesanan mandiri (self-ordering system) merupakan inovasi layanan berbasis Self-Service Technology (SST) yang memberikan wewenang kepada pelanggan untuk menelusuri katalog menu, memilih varian produk, mengisi catatan khusus, dan mengirimkan pesanan secara langsung dari tempat duduk pelanggan tanpa perlu berinteraksi tatap muka dengan pramusaji atau mengantre di kasir. Penerapan sistem pemesanan mandiri terbukti efektif mengeliminasi waktu antrean di kasir, meminimalkan salah catat pesanan, dan meningkatkan kenyamanan bersantap."))
    
    # 2.2.2
    elems.append(heading("2.2.2  Teknologi Quick Response Code (QR Code)", level=3))
    elems.append(p("Quick Response Code (QR Code) adalah jenis kode matriks dua dimensi yang dikembangkan oleh Denso Wave pada tahun 1994. QR Code memiliki kapasitas penyimpanan data yang jauh lebih tinggi dibandingkan kode batang linear satu dimensi (barcode) konvensional serta mampu dibaca secara cepat dari berbagai sudut orientasi 360 derajat (omnidirectional)."))
    elems.append(p("Struktur QR Code dilengkapi dengan pola penemu posisi (position detection patterns) pada tiga sudutnya dan modul koreksi kesalahan (Error Correction Code) berbasis algoritma Reed-Solomon. Adanya kode koreksi kesalahan ini memungkinkan kode QR tetap dapat terpindai secara valid meskipun mengalami kerusakan fisik atau noda kotoran hingga toleransi 30%. Dalam sistem pemesanan mandiri gerai coffeeshop, kode QR dimanfaatkan untuk menyimpan tautan unik (Uniform Resource Locator / URL) yang memuat token parameter nomor meja tertentu (misalnya Meja 01 s/d Meja 05). Ketika pelanggan memindai kode tersebut menggunakan kamera ponsel pintar, peramban secara otomatis akan membuka aplikasi web pemesanan yang telah terverifikasi dengan nomor meja terkait."))
    
    # 2.2.3
    elems.append(heading("2.2.3  Kitchen Display System (KDS) dan Konsep First-In, First-Out (FIFO)", level=3))
    elems.append(p("Kitchen Display System (KDS) adalah sistem berbasis layar digital yang menggantikan peran kertas tiket pesanan konvensional pada area produksi atau dapur. KDS menampilkan antrean pesanan yang masuk secara waktu nyata (real-time), lengkap dengan rincian nama menu, varian modifikasi rasa, catatan khusus, dan identitas nomor meja asal pemesanan."))
    elems.append(p("Untuk menjamin keadilan pelayanan dan ketertiban alur kerja barista, KDS menerapkan prinsip First-In, First-Out (FIFO). Dalam konsep FIFO, pesanan yang memiliki stempel waktu pembuatan (created_at) lebih awal wajib diposisikan pada prioritas utama antrean dan diracik terlebih dahulu sebelum pesanan yang masuk belakangan. Melalui penerapan KDS berbasis FIFO, keluhan pelanggan akibat pesanan yang tertukar atau terlewat dapat dihindari secara konsisten."))
    
    # 2.2.4
    elems.append(heading("2.2.4  Sistem Point of Sale (POS) dan Pajak Restoran (PB1)", level=3))
    elems.append(p("Point of Sale (POS) adalah sistem terminal transaksi kasir yang digunakan untuk mencatat penjualan, menerima pembayaran dari pelanggan (baik tunai maupun nontunai), serta mencetak bukti pembayaran berupa struk nota. Sistem POS modern berfungsi sebagai pusat rekonsiliasi kas gerai, di mana kasir wajib mencatat modal kas awal laci (starting cash) saat pembukaan shift dan menghitung kas fisik akhir saat penutupan shift guna mendeteksi ada tidaknya selisih kas (cash difference)."))
    elems.append(p("Dalam pengelolaan keuangan gerai makanan dan minuman, diberlakukan Pajak Restoran atau Pajak Barang dan Jasa Tertentu (PB1) dengan tarif standar sebesar 10% dari nilai subtotal transaksi penjualan. Sistem POS terintegrasi secara otomatis melakukan kalkulasi penambahan nilai pajak PB1 10% dan biaya layanan (jika berlaku), sehingga nilai omzet bersih dan kewajiban penyetoran pajak daerah dapat terdata secara akurat dan transparan."))
    
    # 2.2.5
    elems.append(heading("2.2.5  Arsitektur Representational State Transfer Application Programming Interface (RESTful API)", level=3))
    elems.append(p("Representational State Transfer (REST) adalah gaya arsitektur perangkat lunak untuk sistem terdistribusi yang pertama kali diperkenalkan oleh Roy Fielding pada tahun 2000. REST mendefinisikan sekumpulan prinsip arsitektur yang mengutamakan pemisahan peran antara klien dan peladen (client-server separation), ketiadaan penyimpanan status sesi pada peladen (statelessness), kemampuan penyimpanan cache (cacheability), serta antarmuka yang seragam (uniform interface)."))
    elems.append(p("RESTful API memanfaatkan kata kerja protokol HTTP standar (HTTP Methods), yaitu GET untuk membaca sumber daya data, POST untuk membuat data baru, PUT atau PATCH untuk memperbarui data, dan DELETE untuk menghapus data. Pertukaran data antar sistem diformat menggunakan JavaScript Object Notation (JSON), format data berbasis teks terbuka yang sangat ringan, mudah dipahami, dan cepat diurai oleh peramban modern."))
    
    # 2.2.6
    elems.append(heading("2.2.6  Kerangka Kerja Laravel 11 dan Bahasa Pemrograman PHP", level=3))
    elems.append(p("Hypertext Preprocessor (PHP) adalah bahasa pemrograman skrip sisi server (server-side scripting) yang sangat luas digunakan dalam pengembangan aplikasi web dinamis. Pada arsitektur RESTful API, PHP bertanggung jawab menerima permintaan HTTP, mengeksekusi logika bisnis, memvalidasi masukan, dan berinteraksi dengan sistem basis data."))
    elems.append(p("Laravel adalah kerangka kerja web sumber terbuka berbasis PHP yang dikembangkan oleh Taylor Otwell dengan filosofi sintaks yang ekspresif dan elegan. Laravel 11 menyediakan arsitektur yang tangguh untuk pengembangan backend API korporat, antara lain Eloquent Object-Relational Mapping (ORM) untuk manipulasi data relasional berorientasi objek, middleware autentikasi token berbasis Laravel Sanctum, sistem manajemen peran Spatie Role-Based Access Control (RBAC), migrasi skema basis data versi kontrol, serta penanganan transaksi basis data ACID."))
    
    # 2.2.7
    elems.append(heading("2.2.7  Library React 18, TypeScript, dan Tailwind CSS", level=3))
    elems.append(p("React.js adalah library JavaScript berbasis komponen (Component-Based) yang dikembangkan oleh Meta untuk membangun antarmuka pengguna yang reaktif dan dinamis. React menerapkan model Single Page Application (SPA) dan Virtual Document Object Model (Virtual DOM), yang memungkinkan pembaharuan tampilan antarmuka secara selektif pada bagian yang mengalami perubahan data tanpa merender ulang keseluruhan halaman web."))
    elems.append(p("TypeScript adalah bahasa pemrograman superset dari JavaScript yang menambahkan pengetikan tipe statis ketat (strict static typing). Dengan adanya pemeriksaan tipe pada saat penulisan dan kompilasi (compile-time checking), kesalahan logika dan inkonsistensi tipe data dapat dideteksi sejak dini, meningkatkan keandalan kode sistem pemesanan."))
    elems.append(p("Tailwind CSS adalah kerangka kerja CSS berbasis Utility-First yang menyediakan kelas-kelas utilitas atomik untuk perancangan tata letak antarmuka web. Tailwind CSS memfasilitasi pembuatan antarmuka responsif (Mobile-First) yang adaptif terhadap berbagai ukuran layar smartphone, tablet, maupun layar komputer kasir dengan ukuran berkas keluaran yang sangat optimal."))
    
    # 2.2.8
    elems.append(heading("2.2.8  Basis Data Relasional MySQL 8.0 dan Relational Mapping", level=3))
    elems.append(p("Basis data relasional adalah sistem penyimpanan data terstruktur di mana data diorganisasikan ke dalam bentuk tabel-tabel dua dimensi yang saling berelasi melalui kunci utama (Primary Key) dan kunci tamu (Foreign Key). MySQL 8.0 adalah Relational Database Management System (DBMS) sumber terbuka yang memiliki performa tinggi, stabilitas teruji, dan mendukung integritas referensial secara menyeluruh."))
    elems.append(p("Basis data relasional menjamin keandalan transaksi sistem melalui pemenuhan prinsip ACID (Atomicity, Consistency, Isolation, dan Durability). Prinsip ini sangat krusial dalam sistem pemesanan coffeeshop, terutama saat terjadi transaksi bersamaan (konkurensi) yang melibatkan pembuatan nomor order, pencatatan item rincian pesanan, dan pemotongan stok bahan baku resep dalam satu kesatuan operasi yang tidak boleh terputus."))
    
    # 2.2.9
    elems.append(heading("2.2.9  Pemodelan Sistem Terstruktur (Data Flow Diagram / DFD)", level=3))
    elems.append(p("Data Flow Diagram (DFD) adalah teknik pemodelan grafis yang menggambarkan aliran data melalui suatu sistem informasi, proses-proses transformasi data yang terjadi, entitas luar yang berinteraksi dengan sistem, serta tempat penyimpanan data (data store) yang digunakan (Kendall dan Kendall, 2014)."))
    elems.append(p("Tingkatan diagram DFD yang digunakan dalam perancangan sistem ini mencakup: (1) DFD Level 0 atau Diagram Konteks, yang memetakan batas sistem secara makro dengan menampilkan seluruh entitas eksternal; (2) DFD Level 1, yang mendekomposisi sistem menjadi 7 proses operasional utama dan 7 data store; serta (3) DFD Level 2, yang merinci subproses spesifik pada proses pemesanan mandiri meja pelanggan."))
    
    # 2.2.10
    elems.append(heading("2.2.10  Pemodelan Basis Data Konseptual (Entity Relationship Diagram / ERD)", level=3))
    elems.append(p("Entity Relationship Diagram (ERD) adalah model konseptual data yang memetakan objek-objek penting dalam sistem (entitas), karakteristik dari objek tersebut (atribut), serta keterhubungan antar objek (relasi) beserta derajat kardinalitasnya (one-to-one, one-to-many, atau many-to-many). ERD memberikan landasan perancangan skema fisik basis data relasional yang bebas dari anomali peremajaan, penyisipan, dan penghapusan data."))
    
    # 2.2.11
    elems.append(heading("2.2.11  Pengujian Perangkat Lunak Metode Black Box Testing", level=3))
    elems.append(p("Black Box Testing adalah metode pengujian perangkat lunak yang berfokus pada spesifikasi fungsionalitas sistem tanpa membedah atau mengetahui struktur kode internal program (Pressman dan Maxim, 2020). Penguji memberikan serangkaian masukan data tertentu ke dalam antarmuka sistem dan memverifikasi apakah luaran atau perilaku yang dihasilkan telah sesuai dengan skenario yang diharapkan."))
    elems.append(p("Teknik pengujian Black Box yang diterapkan meliputi Equivalence Partitioning dan Boundary Value Analysis untuk menguji validitas pemindaian token QR meja, kalkulasi subtotal belanja, akurasi penambahan pajak PB1 (10%), kebenaran pengurangan saldo stok bahan baku pada kartu mutasi stok, serta validasi selisih kas fisik pada penutupan shift kasir."))
    
    return elems

print("BAB II module elements defined.")
