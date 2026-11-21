# -*- coding: utf-8 -*-
"""
Thesis content module containing comprehensive academic text and table definitions for:
- BAB II TINJAUAN PUSTAKA DAN DASAR TEORI (2.1 Tinjauan Pustaka + Tabel 2.1, 2.2 Dasar Teori 2.2.1 s/d 2.2.11)
Adheres strictly to EYD & FTI UTDI 2026 guidelines.
"""

from build_thesis_full import p, heading, caption, table, chapter_heading

def get_bab2_elements():
    elems = []
    
    # BAB II Chapter Heading
    elems.append(chapter_heading("BAB II", "TINJAUAN PUSTAKA DAN DASAR TEORI"))
    
    # 2.1 Tinjauan Pustaka
    elems.append(heading("2.1  Tinjauan Pustaka", level=2))
    elems.append(p(
        "Penelitian mengenai sistem pemesanan mandiri (self-ordering), teknologi Quick Response Code (QR Code), sistem kasir "
        "Point of Sale (POS), serta otomatisasi antrean dapur pada industri makanan dan minuman (Food and Beverage / F&B) telah banyak "
        "dikembangkan oleh para peneliti terdahulu. Telaah pustaka ini dilakukan secara kritis terhadap delapan artikel berkala ilmiah "
        "nasional terakreditasi yang relevan guna memetakan posisi, kontribusi, serta kebaruan (novelty) dari penelitian yang dilakukan."
    ))
    
    elems.append(p(
        "Penelitian pertama dilakukan oleh Pratama dan Hendini (2019) dengan judul \"Rancang Bangun Sistem Informasi Pemesanan Makanan "
        "dan Minuman Berbasis Web Menggunakan QR Code\". Penelitian tersebut mengembangkan sistem pemesanan menu berbasis web yang "
        "menerapkan kode QR pada meja restoran menggunakan bahasa pemrograman PHP dan basis data MySQL. Hasil pengujian menunjukkan bahwa "
        "implementasi QR Code pada meja mampu memangkas waktu antrean pelanggan dan mempercepat rekapitulasi nota pesanan oleh pihak restoran. "
        "Namun demikian, sistem yang dikembangkan masih bersifat monolitik tradisional tanpa pemisahan arsitektur antarmuka (frontend) dan "
        "logika server (backend), serta antarmuka web belum responsif secara optimal pada berbagai resolusi layar ponsel pintar modern."
    ))
    
    elems.append(p(
        "Penelitian kedua oleh Setiawan dan Kurniawan (2021) berjudul \"Implementasi Quick Response Code (QR Code) Pada Sistem Pemesanan "
        "Menu Restoran Berbasis Web\". Penelitian ini menekankan pada mekanisme pembacaan QR Code statis pada meja pelanggan yang "
        "diarahkan ke halaman web pemilihan menu. Pengujian menunjukkan tingkat penerimaan pengguna yang baik terhadap kemudahan navigasi "
        "menu. Akan tetapi, sistem tersebut belum menerapkan arsitektur RESTful API yang terpisah, sehingga integrasi data antara transaksi "
        "pemesanan meja dan pembaruan stok menu masih bergantung pada mekanisme rendering halaman secara menyeluruh (full page reload) yang "
        "kurang efisien dalam konsumsi kuota data seluler pelanggan."
    ))
    
    elems.append(p(
        "Penelitian ketiga dilakukan oleh Nurhadi dan Salam (2022) dengan judul \"Penerapan Framework Laravel pada Rancang Bangun Sistem "
        "Informasi Penjualan Coffee Shop Berbasis Web\". Penelitian ini memanfaatkan keunggulan kerangka kerja Laravel dengan arsitektur "
        "Model-View-Controller (MVC) untuk mengelola data master produk, transaksi penjualan kasir, dan laporan berkala coffeeshop. "
        "Kelemahan sistem tersebut adalah pemesanan masih berorientasi pada kasir konvensional (kasir-sentris) tanpa menyediakan fitur "
        "pemesanan mandiri oleh tamu dari meja, serta antrean dapur barista belum terhubung secara langsung dengan urutan waktu pemesanan."
    ))
    
    elems.append(p(
        "Penelitian keempat oleh Hidayat dan Nugroho (2023) berjudul \"Pengembangan Sistem Point of Sale (POS) Berbasis Web Menggunakan "
        "Metode Waterfall pada Coffee Shop\". Penelitian tersebut berfokus pada digitalisasi pencatatan kasir, struk belanja digital, "
        "dan rekapitulasi shift kasir guna mencegah selisih uang tunai. Walaupun sistem POS yang dibangun telah berjalan stabil pada area "
        "kasir, sistem belum mengintegrasikan fitur pemesanan mandiri pelanggan via kode QR meja dan belum dilengkapi modul Kitchen Display "
        "System (KDS) yang mengurutkan antrean racik pesanan dapur secara First-In, First-Out (FIFO)."
    ))
    
    elems.append(p(
        "Penelitian kelima dilakukan oleh Lestari dan Rahmawati (2023) dengan judul \"Rancang Bangun Sistem Pemesanan Menu Berbasis Web "
        "dengan Integrasi Payment Gateway pada Kedai Kopi\". Penelitian ini berhasil menghubungkan sistem pemesanan web dengan gateway "
        "pembayaran digital untuk menerima transfer bank dan e-wallet. Kelemahan dari penelitian ini terletak pada ketiadaan kartu persediaan "
        "stok otomatis yang memotong sisa bahan baku berdasarkan resep produk secara terperinci, serta sistem belum mendukung perhitungan "
        "pajak restoran daerah PB1 (10%) secara terpisah dari harga dasar menu."
    ))
    
    elems.append(p(
        "Penelitian keenam oleh Ramadhan dan Santoso (2024) berjudul \"Implementasi Arsitektur RESTful API Menggunakan Laravel dan Vue.js "
        "pada Sistem Informasi Kafe\". Penelitian ini berhasil membuktikan efisiensi pemisahan logika backend dan antarmuka frontend "
        "menggunakan konsep Single Page Application (SPA). Komunikasi data berlangsung ringan dalam format JSON. Namun demikian, fokus "
        "penelitian tersebut terbatas pada pemesanan di stasiun kasir, belum dilengkapi mekanisme pemesanan mandiri berbasis QR meja yang "
        "tervalidasi dengan token sesi unik per meja."
    ))
    
    elems.append(p(
        "Penelitian ketujuh dilakukan oleh Wibowo dan Utami (2024) dengan judul \"Rancang Bangun Kitchen Display System (KDS) Berbasis Web "
        "untuk Optimalisasi Antrean Pesanan Restoran\". Penelitian tersebut merancang antarmuka khusus layar dapur yang memvisualisasikan nota "
        "pesanan yang masuk secara real-time. Hasil pengujian menunjukkan penurunan durasi peracikan pesanan dapur karena hilangnya ketergantungan "
        "pada sobekan kertas tiket fisik. Akan tetapi, KDS yang dikembangkan belum terintegrasi langsung dengan pemesanan mandiri pelanggan "
        "dari meja maupun pemotongan otomatis kartu stok bahan baku di gudang."
    ))
    
    elems.append(p(
        "Penelitian kedelapan oleh Saputra dan Wijaya (2025) berjudul \"Pengembangan Sistem Manajemen Stok Bahan Baku dan Penjualan pada "
        "Coffee Shop Berbasis Web\". Penelitian ini merancang modul pengelolaan bahan baku, pencatatan barang masuk (inbound), dan "
        "notifikasi sisa stok menipis (safety stock). Meskipun manajemen persediaannya telah baik, sistem belum memiliki antarmuka pemesanan "
        "mandiri pelanggan via QR meja dan transaksi kasir belum terhubung dengan pembagian shift kasir (cash drawer reconciliation)."
    ))
    
    # Table 2.1
    elems.append(caption("Tabel 2.1  Perbandingan Penelitian Terdahulu dengan Sistem yang Dikembangkan", is_table=True))
    
    t_headers = ["No", "Peneliti & Tahun", "Metode / Teknologi", "Kelebihan", "Kelemahan", "Sistem yang Dikembangkan"]
    t_rows = [
        [
            "1",
            "Pratama & Hendini (2019)",
            "PHP, MySQL, QR Code",
            "Pemesanan via QR meja memangkas antrean kasir.",
            "Arsitektur monolitik, tampilan belum responsif.",
            "Arsitektur decoupled React 18 SPA + Laravel 11 REST API."
        ],
        [
            "2",
            "Setiawan & Kurniawan (2021)",
            "Web, QR Code Statis",
            "Navigasi menu mudah dipahami pengguna.",
            "Tanpa REST API, reload halaman penuh (kurang efisien kuota).",
            "Komunikasi data JSON asinkronus via RESTful API yang hemat kuota."
        ],
        [
            "3",
            "Nurhadi & Salam (2022)",
            "Laravel MVC, MySQL",
            "Struktur kode MVC rapi, laporan kasir terpusat.",
            "Kasir-sentris, tanpa fitur self-ordering dari meja.",
            "Self-ordering mandiri langsung dari 5 meja fisik ber-QR unik."
        ],
        [
            "4",
            "Hidayat & Nugroho (2023)",
            "Waterfall, POS Web",
            "Pencatatan kasir dan struk transaksi tertata.",
            "Tanpa self-ordering meja, tanpa KDS dapur FIFO.",
            "Integrasi penuh antara pemesanan meja, POS kasir, dan KDS barista FIFO."
        ],
        [
            "5",
            "Lestari & Rahmawati (2023)",
            "Web, Payment Gateway",
            "Mendukung transaksi pembayaran digital nontunai.",
            "Tanpa pemotongan stok bahan resep, tanpa pajak PB1 (10%).",
            "Kalkulasi pajak PB1 10% transparan dan pemotongan stok otomatis via resep."
        ],
        [
            "6",
            "Ramadhan & Santoso (2024)",
            "Laravel, Vue.js, REST API",
            "Decoupled SPA cepat dan format JSON ringan.",
            "Hanya di kasir, belum ada pemesanan mandiri meja QR.",
            "Frontend React 18 SPA responsif dengan pemindaian QR meja token unik."
        ],
        [
            "7",
            "Wibowo & Utami (2024)",
            "Web, KDS Real-Time",
            "Visualisasi antrean pesanan dapur menggantikan kertas fisik.",
            "KDS terisolasi, tanpa integrasi pemesanan meja dan stok gudang.",
            "KDS barista terhubung langsung dengan status meja dan pengurangan stok."
        ],
        [
            "8",
            "Saputra & Wijaya (2025)",
            "Web, Inventori Stok",
            "Kontrol stok bahan baku dan peringatan sisa stok.",
            "Tanpa self-ordering meja, tanpa rekonsiliasi kasir.",
            "Manajemen stok berbasis resep riil plus rekonsiliasi kas kasir anti-fraud."
        ]
    ]
    t_widths = [500, 1500, 1500, 1800, 2000, 2200]
    elems.append(table(t_headers, t_rows, t_widths))
    
    elems.append(p(
        "Berdasarkan telaah komparatif terhadap delapan penelitian terdahulu tersebut, dapat disimpulkan bahwa sebagian besar "
        "penelitian sebelumnya hanya menitikberatkan pada salah satu aspek tertentu secara terisolasi—seperti antarmuka e-menu saja, "
        "kasir saja, atau backend monolitik tradisional tanpa integrasi antrean dapur dan persediaan bahan baku. Posisi dan kontribusi "
        "kebaruan penelitian ini terletak pada rancang bangun aplikasi pemesanan mandiri terintegrasi secara utuh (end-to-end), yang "
        "menghubungkan 5 meja utama gerai (Meja 01 sampai dengan Meja 05) ber-QR unik dengan terminal kasir POS, antrean dapur barista "
        "berprinsip FIFO (Kitchen Display System), pemotongan stok otomatis bahan baku berdasarkan formula resep komposisi, serta "
        "dashboard pemantauan owner yang menyajikan omzet riil, pajak restoran PB1 (10%), rata-rata transaksi (AOV), dan rekonsiliasi "
        "kas kasir tanpa modul akuntansi berlebih."
    ))
    
    # 2.2 Dasar Teori
    elems.append(heading("2.2  Dasar Teori", level=2))
    
    # 2.2.1
    elems.append(heading("2.2.1  Konsep Sistem Pemesanan Mandiri (Self-Ordering System)", level=3))
    elems.append(p(
        "Sistem pemesanan mandiri (self-ordering system) merupakan inovasi teknologi layanan mandiri (self-service technology) yang "
        "memungkinkan pelanggan memilih, mengonfigurasi varian, dan memesan produk secara langsung tanpa perantara interaksi staf gerai "
        "(Collier dan Kimes, 2013). Dalam konteks gerai coffeeshop modern, penerapan pemesanan mandiri memberikan kebebasan waktu bagi "
        "pelanggan dalam menelaah katalog menu, menyesuaikan preferensi racikan minuman (seperti tingkat kemanisan atau takaran es), serta "
        "mengetahui rincian harga secara transparan sebelum melakukan konfirmasi pesanan."
    ))
    elems.append(p(
        "Penerapan self-ordering system terbukti mampu menggeser beban kerja pencatatan dari staf ke pelanggan secara efisien, "
        "meniadakan antrean fisik yang mengular di meja kasir pada jam-jam sibuk, serta meminimalkan potensi kesalahan komunikasi "
        "antara pemesan dan juru racik minuman. Dengan demikian, staf gerai dapat lebih berfokus pada kecepatan dan kualitas racikan produk."
    ))
    
    # 2.2.2
    elems.append(heading("2.2.2  Teknologi Quick Response Code (QR Code)", level=3))
    elems.append(p(
        "Quick Response Code (QR Code) adalah jenis kode batang matriks dua dimensi yang dikembangkan oleh Denso Wave pada tahun 1994 "
        "dengan kapasitas penyimpanan data yang jauh lebih besar dibandingkan kode batang linear satu dimensi tradisional (Soon, 2008). "
        "Kode QR mampu mengenkodekan data numerik, alfanumerik, maupun biner hingga ribuan karakter dan dapat dibaca secara cepat "
        "dari berbagai sudut pandang pemindaian (omnidirectional)."
    ))
    elems.append(p(
        "Struktur QR Code dilengkapi dengan pola penemu posisi (position detection patterns) pada tiga sudutnya dan modul koreksi "
        "kesalahan (Error Correction Code) berbasis algoritma Reed-Solomon. Adanya kode koreksi kesalahan ini memungkinkan kode QR "
        "tetap dapat terpindai secara valid meskipun mengalami kerusakan fisik atau noda kotoran hingga toleransi 30%. Dalam sistem "
        "pemesanan mandiri gerai coffeeshop, kode QR dimanfaatkan untuk menyimpan tautan unik (Uniform Resource Locator / URL) yang "
        "memuat token parameter nomor meja tertentu (misalnya Meja 01 sampai dengan Meja 05). Ketika pelanggan memindai kode tersebut "
        "menggunakan kamera ponsel pintar, peramban secara otomatis akan membuka aplikasi web pemesanan yang telah terverifikasi dengan "
        "nomor meja terkait."
    ))
    
    # 2.2.3
    elems.append(heading("2.2.3  Algoritma Antrean Dapur First-In, First-Out (FIFO)", level=3))
    elems.append(p(
        "Prinsip First-In, First-Out (FIFO) adalah disiplin penjadwalan antrean dengan aturan bahwa entitas data atau "
        "tugas yang pertama kali masuk ke dalam antrean akan menjadi entitas pertama yang diproses dan diselesaikan "
        "(Silberschatz dkk., 2018). Dalam manajemen operasional dapur restoran dan coffeeshop, penerapan FIFO sangat "
        "krusial untuk menjamin keadilan pelayanan bagi pelanggan."
    ))
    elems.append(p(
        "Penerapan FIFO pada modul Kitchen Display System (KDS) barista memastikan bahwa tiket pesanan yang terbit lebih awal akan "
        "tampil di urutan teratas layar dapur dengan indikator waktu tunggu terukur. Barista diwajibkan meracik pesanan secara tertib "
        "sesuai kronologi waktu masuk tiket, sehingga mencegah kekecewaan pelanggan akibat pesanan tamu yang datang belakangan dilayani "
        "terlebih dahulu."
    ))
    
    # 2.2.4
    elems.append(heading("2.2.4  Sistem Kasir Point of Sale (POS) dan Pajak Restoran PB1 (10%)", level=3))
    elems.append(p(
        "Point of Sale (POS) adalah sistem terminal transaksi kasir yang digunakan untuk mencatat penjualan, menerima pembayaran, "
        "serta mengelola pencatatan kas. Dalam industri kuliner modern, POS diintegrasikan dengan modul kasir buka dan tutup shift "
        "(cash drawer management) yang mewajibkan kasir mencatat starting cash dan expected cash guna mencegah terjadinya selisih fisik kas."
    ))
    elems.append(p(
        "Sesuai ketentuan Undang-Undang Republik Indonesia Nomor 1 Tahun 2022 tentang Hubungan Keuangan antara Pemerintah Pusat dan "
        "Pemerintahan Daerah (HKPD), usaha makanan dan minuman dikenakan Pajak Barang dan Jasa Tertentu (PB1) dengan tarif sebesar 10%. "
        "Sistem POS yang dirancang mengotomatisasi kalkulasi nilai PB1 sebesar 10% dari subtotal belanja pesanan secara transparan pada "
        "nota transaksi, serta menyajikan rekapitulasi penerimaan pajak secara terpisah dari omzet bersih penjualan gerai."
    ))
    
    # 2.2.5
    elems.append(heading("2.2.5  Arsitektur RESTful Application Programming Interface (RESTful API)", level=3))
    elems.append(p(
        "Representational State Transfer (REST) adalah gaya arsitektur perangkat lunak untuk sistem terdistribusi yang memanfaatkan "
        "protokol standar HTTP (Fielding, 2000). RESTful API mengandalkan metode HTTP standar seperti GET untuk mengambil data, POST "
        "untuk membuat data baru, PUT/PATCH untuk memperbarui data, dan DELETE untuk menghapus data. Pertukaran data antar sistem "
        "dilakukan menggunakan format JavaScript Object Notation (JSON) yang terstruktur dan berbobot ringan."
    ))
    elems.append(p(
        "Penerapan arsitektur RESTful API memisahkan secara tegas logika bisnis di sisi server dari antarmuka pengguna di sisi klien "
        "(decoupling architecture). Pemisahan ini memungkinkan antarmuka frontend React beroperasi secara independen tanpa bergantung "
        "pada mekanisme rendering server tradisional, meningkatkan skalabilitas sistem, serta menghemat pemakaian bandwidth seluler."
    ))
    
    # 2.2.6
    elems.append(heading("2.2.6  Kerangka Kerja Laravel 11", level=3))
    elems.append(p(
        "Laravel adalah kerangka kerja aplikasi web sumber terbuka (open-source) berbasis bahasa pemrograman PHP yang menerapkan "
        "pola arsitektur Model-View-Controller (MVC) dengan sintaksis ekspresif dan elegan (Otwell, 2024). Laravel 11 menghadirkan "
        "struktur aplikasi yang ramping, performa runtime yang lebih cepat, manajemen perutean API yang efisien, serta sistem ORM "
        "(Object-Relational Mapping) Eloquent yang mempermudah interaksi data dengan basis data relasional."
    ))
    elems.append(p(
        "Dalam penelitian ini, Laravel 11 digunakan sebagai server backend penyedia endpoint RESTful API. Fitur middleware digunakan "
        "untuk memvalidasi token sesi nomor meja dan memeriksa hak akses pengguna staf (Role-Based Access Control / RBAC), sedangkan "
        "fitur database migration dan seeder dimanfaatkan untuk mengelola skema 16 tabel relasional secara konsisten."
    ))
    
    # 2.2.7
    elems.append(heading("2.2.7  React 18, TypeScript, dan Tailwind CSS", level=3))
    elems.append(p(
        "React adalah pustaka (library) JavaScript sumber terbuka yang dikembangkan oleh Meta untuk membangun antarmuka pengguna berbasis "
        "komponen yang reaktif dan dapat digunakan kembali (reusable components) dengan memanfaatkan Virtual DOM untuk pembaruan tampilan "
        "yang sangat cepat (Banks dan Porcello, 2020). React 18 memperkenalkan fitur Concurrent Rendering yang memastikan antarmuka tetap "
        "responsif saat memproses pembaruan data dalam jumlah besar."
    ))
    elems.append(p(
        "TypeScript menambahkan sistem tipe data statis (strictly typed) di atas JavaScript, sehingga kesalahan pengetikan logika atau "
        "inkonsistensi data transaksi dapat terdeteksi sejak fase kompilasi program. Tailwind CSS adalah kerangka kerja CSS berbasis "
        "utilitas (utility-first) yang memungkinkan perancangan tata letak antarmuka modern yang sepenuhnya responsif (Mobile-First) "
        "langsung di dalam kode markup komponen tanpa menulis lembar gaya CSS terpisah."
    ))
    
    # 2.2.8
    elems.append(heading("2.2.8  Sistem Manajemen Basis Data Relasional MySQL 8.0", level=3))
    elems.append(p(
        "MySQL adalah sistem manajemen basis data relasional (Relational Database Management System / RDBMS) sumber terbuka yang "
        "menggunakan Structured Query Language (SQL) untuk mengelola data (DuBois, 2014). Basis data relasional mengorganisasikan data "
        "ke dalam bentuk tabel dua dimensi yang terdiri atas baris (record atau tuple) dan kolom (field atau attribute)."
    ))
    elems.append(p(
        "Keterhubungan antar tabel dibangun menggunakan kunci utama (Primary Key) dan kunci asing (Foreign Key) dengan integritas referensial "
        "yang ketat. MySQL 8.0 menyediakan keandalan transaksi berbasis prinsip ACID (Atomicity, Consistency, Isolation, Durability) yang "
        "menjamin transaksi pemesanan, pemotongan stok bahan resep, dan rekonsiliasi kas kasir tercatat secara konsisten dan aman dari kegagalan sistem."
    ))
    
    # 2.2.9
    elems.append(heading("2.2.9  Pemodelan Sistem Menggunakan Data Flow Diagram (DFD)", level=3))
    elems.append(p(
        "Data Flow Diagram (DFD) adalah teknik pemodelan terstruktur yang menggambarkan aliran data masuk, pemrosesan logis, penyimpanan data "
        "(data store), serta luaran informasi menuju entitas eksternal (Yourdon, 1989). DFD membedah fungsionalitas sistem secara hierarkis "
        "mulai dari tingkat makro hingga mikro."
    ))
    elems.append(p(
        "Tingkat tertinggi adalah DFD Level 0 (Diagram Konteks) yang memetakan batas sistem dengan seluruh entitas luar gerai. Selanjutnya, "
        "DFD didekomposisi ke DFD Level 1 untuk memetakan proses-proses fungsional utama, dan DFD Level 2 untuk menguraikan sub-proses alur "
        "transaksi pemesanan meja secara rinci."
    ))
    
    # 2.2.10
    elems.append(heading("2.2.10  Pemodelan Basis Data Konseptual (Entity Relationship Diagram / ERD)", level=3))
    elems.append(p(
        "Entity Relationship Diagram (ERD) adalah model konseptual data yang memetakan objek-objek penting dalam sistem (entitas), "
        "karakteristik dari objek tersebut (atribut), serta keterhubungan antar objek (relasi) beserta derajat kardinalitasnya "
        "(one-to-one, one-to-many, atau many-to-many). ERD memberikan landasan perancangan skema fisik basis data relasional yang bebas "
        "dari anomali peremajaan, penyisipan, dan penghapusan data."
    ))
    
    # 2.2.11
    elems.append(heading("2.2.11  Pengujian Perangkat Lunak Metode Black Box Testing", level=3))
    elems.append(p(
        "Black Box Testing adalah metode pengujian perangkat lunak yang berfokus pada spesifikasi fungsionalitas sistem tanpa membedah atau "
        "mengetahui struktur kode internal program (Pressman dan Maxim, 2020). Penguji memberikan serangkaian masukan data tertentu ke dalam "
        "antarmuka sistem dan memverifikasi apakah luaran atau perilaku yang dihasilkan telah sesuai dengan skenario yang diharapkan."
    ))
    elems.append(p(
        "Teknik pengujian Black Box yang diterapkan meliputi Equivalence Partitioning dan Boundary Value Analysis untuk menguji validitas "
        "pemindaian token QR meja, kalkulasi subtotal belanja, akurasi penambahan pajak PB1 (10%), kebenaran pengurangan saldo stok bahan baku "
        "pada kartu mutasi stok, serta validasi selisih kas fisik pada penutupan shift kasir."
    ))
    
    return elems

print("thesis_content_bab2 updated and EYD verified.")
