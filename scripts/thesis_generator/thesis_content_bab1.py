# -*- coding: utf-8 -*-
"""
Thesis content module containing comprehensive academic text for:
- INTISARI (Bahasa Indonesia, 1 spasi, kata kunci alfabetis miring)
- ABSTRACT (English, 1 space, full text italicized per UTDI guidelines)
- BAB I PENDAHULUAN (1.1 Latar Belakang s/d 1.6 Sistematika Penulisan)
Adheres strictly to EYD & FTI UTDI 2026 guidelines.
"""

from build_thesis_full import p, heading, chapter_heading

def get_intisari_elements():
    """
    Generates INTISARI elements per FTI UTDI guidelines:
    Single spaced (line=240), concise (under 250 words), 3 paragraphs,
    and 3-5 italicized keywords in alphabetical order.
    """
    elems = []
    elems.append(chapter_heading("INTISARI", ""))
    
    elems.append(p(
        "Perkembangan pesat industri makanan dan minuman (Food and Beverage), khususnya gerai coffeeshop modern, "
        "menuntut efisiensi tinggi dalam alur pelayanan transaksi. Sistem pemesanan konvensional yang mewajibkan "
        "pelanggan berdiri mengantre di depan meja kasir atau menunggu pencatatan pesanan manual oleh pramusaji sering "
        "memicu penumpukan antrean fisik pada jam-jam sibuk (peak hours), memperpanjang waktu tunggu (waiting time), "
        "serta meningkatkan risiko kesalahan pencatatan pesanan (human error). Oleh karena itu, diperlukan solusi "
        "pemesanan mandiri (self-ordering) digital yang langsung terintegrasi antara meja makan pelanggan, terminal "
        "kasir (Point of Sale / POS), antrean dapur barista berprinsip First-In, First-Out (FIFO), dan mutasi kartu "
        "stok bahan baku secara otomatis.",
        indent_first=True, space_after=100, space_line=240
    ))
    
    elems.append(p(
        "Penelitian ini bertujuan merancang dan membangun aplikasi pemesanan mandiri berbasis web menggunakan teknologi "
        "Quick Response Code (QR Code) pada 5 meja utama gerai (Meja 01 sampai dengan Meja 05). Sistem dikembangkan "
        "dengan arsitektur terpisah (decoupling) berbasis RESTful API. Antarmuka pengguna (front-end) dibangun menggunakan "
        "React 18, TypeScript, dan Tailwind CSS dalam model Single Page Application (SPA) yang responsif pada peramban "
        "telepon pintar tanpa memerlukan instalasi aplikasi tambahan. Sisi peladen (back-end) dibangun menggunakan kerangka "
        "kerja Laravel 11 dengan basis data relasional MySQL 8.0, menerapkan manajemen peran berbasis Role-Based Access "
        "Control (RBAC) untuk 5 peran staf gerai, antrean dapur barista FIFO, kalkulasi pajak restoran PB1 (10%), serta "
        "integrasi pembayaran nontunai QRIS melalui payment gateway Midtrans tanpa melibatkan modul akuntansi kompleks.",
        indent_first=True, space_after=100, space_line=240
    ))
    
    elems.append(p(
        "Pengujian fungsionalitas sistem dilakukan menggunakan metode Black Box Testing pada seluruh alur transaksi, "
        "pemindaian QR meja, kalkulasi pajak, mutasi otomatis stok bahan baku resep, dan rekonsiliasi kas laci kasir. "
        "Hasil penelitian menunjukkan bahwa sistem berhasil memfasilitasi proses pemesanan mandiri secara cepat dan akurat, "
        "mengeliminasi antrean fisik di depan meja kasir, mempercepat alur peracikan pesanan dapur secara tertib urut "
        "waktu masuk, serta meminimalkan potensi selisih kas fisik melalui pencatatan audit log terintegrasi.",
        indent_first=True, space_after=140, space_line=240
    ))
    
    elems.append(p(
        "Kata Kunci : Black Box Testing, Coffeeshop, Laravel, Pemesanan Mandiri, QR Code",
        bold=False, italic=False, align="left", indent_first=False, space_after=240, space_line=240
    ))
    
    return elems

def get_abstract_elements():
    """
    Generates ABSTRACT elements per FTI UTDI guidelines:
    Written in English, single spaced (line=240), full body typed in italics,
    concise (under 250 words), and 3-5 italicized keywords in alphabetical order.
    """
    elems = []
    elems.append(chapter_heading("ABSTRACT", ""))
    
    elems.append(p(
        "The rapid expansion of the modern culinary industry, notably coffeeshops, demands high efficiency within "
        "transaction service workflows. Conventional ordering methods requiring patrons to queue at cashier counters "
        "or wait for manual server note-taking frequently trigger congestion during peak hours, prolong waiting times, "
        "and elevate the probability of order entry human errors. An integrated digital self-ordering solution directly "
        "connecting customer dining tables, cashier stations, barista kitchen queues, and raw material inventory stock "
        "cards is essential.",
        force_italic=True, indent_first=True, space_after=100, space_line=240
    ))
    
    elems.append(p(
        "This study aims to design and develop a web-based self-ordering application utilizing Quick Response Code (QR Code) "
        "technology across 5 primary dining tables (Table 01 to Table 05). The system is engineered using a decoupled "
        "architecture powered by RESTful APIs. The front-end interface is implemented using React 18, TypeScript, and "
        "Tailwind CSS as a responsive Single Page Application (SPA) accessible via smartphone web browsers without "
        "requiring native application installation. The back-end service is built upon Laravel 11 with a MySQL 8.0 "
        "relational database, featuring Role-Based Access Control (RBAC) across 5 staff roles, a First-In, First-Out "
        "(FIFO) kitchen queue algorithm, restaurant tax PB1 (10%) calculation, and Midtrans QRIS payment gateway integration "
        "without redundant accounting modules.",
        force_italic=True, indent_first=True, space_after=100, space_line=240
    ))
    
    elems.append(p(
        "Functional verification was executed using Black Box Testing across transaction workflows, table QR scanning, "
        "automated inventory recipe deduction, and cashier drawer cash reconciliation. The results confirm that the "
        "system successfully facilitates expeditious and accurate self-ordering, eliminates physical queue bottlenecks "
        "at cashiers, ensures orderly chronological kitchen order preparation, and mitigates cash discrepancies through "
        "integrated audit logging.",
        force_italic=True, indent_first=True, space_after=140, space_line=240
    ))
    
    elems.append(p(
        "Keywords: Black Box Testing, Coffeeshop, Laravel, QR Code, Self-Ordering",
        bold=False, italic=True, align="left", indent_first=False, space_after=240, space_line=240
    ))
    
    return elems

def get_bab1_elements():
    """
    Generates BAB I PENDAHULUAN elements per FTI UTDI guidelines:
    1.1 Latar Belakang (6 paragraphs)
    1.2 Rumusan Masalah (3 points)
    1.3 Ruang Lingkup (8 points)
    1.4 Tujuan Penelitian (3 points)
    1.5 Manfaat Penelitian (3 points: pelanggan, pengelola, IPTEKS)
    1.6 Sistematika Penulisan (naratif 5 bab)
    Times New Roman 12pt, 1.5 line spacing (line=360), indent 1.27cm, foreign terms in italics.
    """
    elems = []
    
    # BAB I Chapter Heading
    elems.append(chapter_heading("BAB I", "PENDAHULUAN"))
    
    # 1.1 Latar Belakang
    elems.append(heading("1.1  Latar Belakang", level=2))
    
    elems.append(p(
        "Perkembangan teknologi informasi dan komunikasi yang sangat pesat telah membawa transformasi signifikan pada "
        "berbagai sektor industri jasa, tidak terkecuali sektor industri makanan dan minuman (Food and Beverage / F&B). "
        "Coffeeshop dan kafe modern saat ini tidak hanya dituntut untuk menyajikan produk minuman dan makanan yang "
        "berkualitas tinggi, melainkan juga dituntut untuk menghadirkan pengalaman pelayanan (customer experience) yang "
        "cepat, praktis, dan efisien. Di tengah tingginya dinamika mobilitas masyarakat perkotaan, efisiensi waktu "
        "tunggu dalam bertransaksi menjadi salah satu tolok ukur utama kepuasan pelanggan terhadap suatu gerai kuliner."
    ))
    
    elems.append(p(
        "Pada sistem operasional gerai coffeeshop konvensional, proses pemesanan menu umumnya dilakukan melalui dua "
        "skema utama, yaitu pelanggan harus berdiri mengantre di depan meja kasir untuk memesan dan membayar secara langsung, "
        "atau pelanggan duduk di meja dan menunggu kedatangan pramusaji yang mencatat pesanan secara manual menggunakan "
        "kertas nota. Kedua skema konvensional tersebut menimbulkan berbagai kelemahan operasional nyata, terutama saat gerai "
        "memasuki jam-jam sibuk (peak hours). Penumpukan antrean panjang di area meja kasir sering kali mengakibatkan "
        "ketidaknyamanan ruang gerak bagi pengunjung, memadati pintu masuk gerai, serta memperpanjang waktu tunggu "
        "(waiting time) pelanggan."
    ))
    
    elems.append(p(
        "Selain kendala antrean fisik, pencatatan pesanan manual oleh staf rentan memicu terjadinya kesalahan manusia "
        "(human error), seperti ketidaksesuaian varian pesanan minuman (ukuran cup, tingkat kemanisan/less sugar, pilihan "
        "es, atau varian susu), kekeliruan pencatatan nomor meja tujuan pengantaran, hingga keterlambatan penyampaian lembar "
        "nota pesanan ke meja barista. Di samping itu, ketiadaan integrasi langsung antara transaksi penjualan kasir dengan "
        "kartu mutasi persediaan di gudang menyebabkan pemantauan sisa bahan baku menjadi terhambat (data silo). Pada area "
        "peracikan dapur barista, ketiadaan sistem antrean pesanan urut waktu masuk (First-In, First-Out / FIFO) kerap "
        "mengakibatkan pesanan yang baru masuk diproses mendahului pesanan sebelumnya yang telah menunggu lebih lama."
    ))
    
    elems.append(p(
        "Seiring dengan penetrasi penggunaan telepon pintar (smartphone) di kalangan masyarakat yang telah merata, "
        "teknologi pemesanan mandiri (self-ordering system) berbasis digital menjadi alternatif solusi yang sangat efektif. "
        "Salah satu teknologi yang fleksibel dan berbiaya implementasi efisien adalah Quick Response Code (QR Code). "
        "Melalui penempatan stiker kode QR unik pada masing-masing meja makan pelanggan (Meja 01 sampai dengan Meja 05), "
        "pelanggan dapat langsung memindai kode tersebut menggunakan kamera telepon pintar tanpa diwajibkan mengunduh atau "
        "memasang aplikasi natif tertentu. Pemindaian QR Code tersebut secara otomatis mengarahkan peramban (browser) "
        "telepon pintar ke antarmuka aplikasi web pemesanan yang telah terasosiasi langsung dengan nomor meja terkait."
    ))
    
    elems.append(p(
        "Penerapan aplikasi berbasis web responsif menawarkan keunggulan lintas platform (cross-platform), sehingga dapat "
        "diakses secara lancar baik melalui sistem operasi Android maupun iOS. Untuk menghadirkan antarmuka pengguna yang "
        "cepat, dinamis, dan modern, pengembangan sisi front-end diimplementasikan menggunakan pustaka React 18 dengan bahasa "
        "TypeScript dan utilitas desain Tailwind CSS dalam arsitektur Single Page Application (SPA). Sementara itu, untuk "
        "menjamin keandalan pengolahan data transaksi, keamanan hak akses multi-peran, serta kalkulasi pajak restoran PB1 (10%), "
        "sisi peladen (back-end) dibangun menggunakan kerangka kerja Laravel 11 berbasis RESTful API yang terhubung dengan "
        "basis data relasional MySQL 8.0, didukung antrean peracikan dapur barista berprinsip FIFO, pembayaran nontunai "
        "QRIS Midtrans, serta rekapitulasi rekonsiliasi kas laci kasir."
    ))
    
    elems.append(p(
        "Berdasarkan permasalahan antrean fisik, risiko salah racik pesanan manual, ketiadaan antrean dapur terstruktur, "
        "serta peluang efisiensi melalui teknologi web dan kode QR tersebut, penelitian tugas akhir ini difokuskan pada "
        "rancang bangun aplikasi dengan judul \"Rancang Bangun Aplikasi Pemesanan Mandiri Berbasis Web Menggunakan QR Code pada CoffeeShop\". "
        "Aplikasi ini diharapkan mampu menyederhanakan alur transaksi pemesanan gerai, memberikan kenyamanan pemesanan "
        "mandiri bagi pelanggan, dan meningkatkan efisiensi operasional gerai secara menyeluruh."
    ))
    
    # 1.2 Rumusan Masalah
    elems.append(heading("1.2  Rumusan Masalah", level=2))
    elems.append(p(
        "Berdasarkan latar belakang permasalahan yang telah diuraikan, rumusan masalah dalam penelitian ini dirumuskan "
        "sebagai berikut:"
    ))
    elems.append(p(
        "1. Bagaimana merancang dan membangun antarmuka aplikasi pemesanan mandiri berbasis web yang responsif menggunakan "
        "pemindaian QR Code pada 5 meja utama (Meja 01 sampai dengan Meja 05) guna mengurangi waktu antrean pelanggan?",
        indent_first=False
    ))
    elems.append(p(
        "2. Bagaimana mengintegrasikan aplikasi web pemesanan mandiri dengan sistem kasir (Point of Sale / POS), antrean "
        "dapur barista berprinsip First-In, First-Out (FIFO), dan pemotongan persediaan bahan baku otomatis berbasis "
        "RESTful API?",
        indent_first=False
    ))
    elems.append(p(
        "3. Bagaimana menguji unjuk kerja dan keandalan fungsionalitas sistem pemesanan mandiri menggunakan metode Black "
        "Box Testing untuk memastikan akurasi alur transaksi, mutasi stok, dan rekonsiliasi kas kasir?",
        indent_first=False
    ))
    
    # 1.3 Ruang Lingkup
    elems.append(heading("1.3  Ruang Lingkup", level=2))
    elems.append(p(
        "Guna menjaga fokus penelitian agar terarah dan mendalam, batasan ruang lingkup sistem ditentukan dalam bentuk "
        "butir-butir batasan sebagai berikut:"
    ))
    elems.append(p(
        "1. Sistem dikembangkan dalam bentuk aplikasi berbasis web responsif (Mobile Web) yang dapat diakses oleh pelanggan "
        "melalui peramban (browser) telepon pintar tanpa mewajibkan instalasi aplikasi natif tertentu.",
        indent_first=False
    ))
    elems.append(p(
        "2. Penerapan sistem pemesanan mandiri difokuskan pada 5 meja utama gerai (Meja 01 sampai dengan Meja 05) dengan "
        "masing-masing meja memiliki token QR Code unik terverifikasi.",
        indent_first=False
    ))
    elems.append(p(
        "3. Sisi antarmuka pengguna (front-end) dibangun menggunakan pustaka React 18 dengan bahasa pemrograman TypeScript, "
        "build tool Vite, dan utilitas tata letak Tailwind CSS dalam arsitektur Single Page Application (SPA).",
        indent_first=False
    ))
    elems.append(p(
        "4. Sisi peladen (back-end) dibangun menggunakan kerangka kerja Laravel 11 berbasis bahasa PHP dengan arsitektur "
        "RESTful API dan sistem manajemen basis data relasional MySQL 8.0.",
        indent_first=False
    ))
    elems.append(p(
        "5. Hak akses sistem mengimplementasikan Role-Based Access Control (RBAC) untuk 5 peran staf gerai, yaitu Kasir "
        "(POS dan shift laci kasir), Barista (Kitchen Display System urut waktu FIFO), Admin Gudang (monitoring stok dan purchase order), "
        "Store Manager (manajemen menu, meja, dan resep bahan), serta Owner (laporan penjualan, omzet, pajak PB1 10%, rata-rata "
        "nilai transaksi AOV, rekonsiliasi kas kasir, dan audit log anti-fraud).",
        indent_first=False
    ))
    elems.append(p(
        "6. Modul akuntansi kompleks (laba rugi komprehensif, jurnal umum berulang, dan neraca saldo) ditiadakan untuk "
        "menjaga fokus sistem pada efisiensi operasional gerai, akurasi pesanan, dan keandalan rekonsiliasi kas fisik.",
        indent_first=False
    ))
    elems.append(p(
        "7. Integrasi pembayaran nontunai memanfaatkan payment gateway Midtrans untuk transaksi QRIS dinamis, di samping "
        "penerimaan pembayaran tunai langsung di meja kasir.",
        indent_first=False
    ))
    elems.append(p(
        "8. Pengujian sistem dilakukan menggunakan metode Black Box Testing untuk menguji fungsionalitas pemindaian QR meja, "
        "kalkulasi subtotal dan pajak restoran PB1 (10%), pemotongan stok bahan baku berdasarkan formula resep, serta "
        "rekonsiliasi kas kasir.",
        indent_first=False
    ))
    
    # 1.4 Tujuan Penelitian
    elems.append(heading("1.4  Tujuan Penelitian", level=2))
    elems.append(p(
        "Tujuan yang hendak dicapai dalam penelitian tugas akhir ini adalah sebagai berikut:"
    ))
    elems.append(p(
        "1. Merancang dan membangun aplikasi pemesanan mandiri berbasis web yang responsif dengan memanfaatkan pemindaian "
        "QR Code pada 5 meja utama gerai guna memangkas antrean fisik dan waktu tunggu pelanggan.",
        indent_first=False
    ))
    elems.append(p(
        "2. Mengintegrasikan aplikasi web pemesanan mandiri dengan sistem kasir (Point of Sale / POS), antrean dapur barista "
        "berprinsip First-In, First-Out (FIFO), dan pemotongan stok bahan baku otomatis menggunakan arsitektur RESTful API.",
        indent_first=False
    ))
    elems.append(p(
        "3. Menguji fungsionalitas dan keandalan sistem pemesanan mandiri menggunakan metode Black Box Testing untuk "
        "memastikan seluruh fitur pemindaian, kalkulasi biaya transaksi, dan rekonsiliasi kas berjalan sesuai spesifikasi "
        "kebutuhan.",
        indent_first=False
    ))
    
    # 1.5 Manfaat Penelitian
    elems.append(heading("1.5  Manfaat Penelitian", level=2))
    elems.append(p(
        "Penelitian ini diharapkan dapat memberikan manfaat praktis dan teoretis bagi berbagai pemangku kepentingan sebagai "
        "berikut:"
    ))
    elems.append(p(
        "1. Manfaat bagi Pelanggan: Memberikan kemudahan dan kenyamanan dalam melakukan pemesanan menu secara mandiri "
        "langsung dari meja makan tanpa perlu mengantre berdiri di kasir, memberikan keleluasaan dalam memilih varian rasa "
        "dan catatan khusus, serta meningkatkan kepuasan bersantap.",
        indent_first=False
    ))
    elems.append(p(
        "2. Manfaat bagi Pengelola Bisnis Coffeeshop: Membantu meningkatkan efisiensi operasional gerai, mengurangi beban "
        "kerja staf kasir pada jam-jam sibuk (peak hours), meminimalkan potensi kesalahan pencatatan pesanan (human error), "
        "menjaga ketertiban antrean racik dapur barista melalui alur FIFO, serta mempermudah pengawasan omzet penjualan dan "
        "rekonsiliasi kas kasir secara akurat.",
        indent_first=False
    ))
    elems.append(p(
        "3. Manfaat bagi Pengembangan Ilmu Pengetahuan dan Teknologi (IPTEKS): Memberikan kontribusi referensi ilmiah dan "
        "wawasan aplikatif dalam bidang rekayasa perangkat lunak, khususnya mengenai penerapan teknologi QR Code dan "
        "arsitektur web modern (React 18 SPA dan Laravel 11 REST API) dalam otomatisasi proses bisnis industri kuliner.",
        indent_first=False
    ))
    
    # 1.6 Sistematika Penulisan
    elems.append(heading("1.6  Sistematika Penulisan", level=2))
    elems.append(p(
        "Sistematika penulisan laporan Tugas Akhir ini disusun secara sistematis ke dalam lima bab pembahasan yang saling "
        "berkesinambungan. Bab I Pendahuluan menguraikan latar belakang permasalahan operasional pemesanan pada industri coffeeshop, "
        "perumusan masalah penelitian, batasan ruang lingkup sistem, tujuan yang hendak dicapai, manfaat penelitian bagi "
        "berbagai pemangku kepentingan, serta gambaran umum sistematika penulisan laporan."
    ))
    elems.append(p(
        "Bab II Tinjauan Pustaka dan Dasar Teori memaparkan telaah kritis terhadap penelitian terdahulu yang relevan dari "
        "jurnal ilmiah terakreditasi beserta tabel komparasi kontribusinya. Bab ini juga memuat landasan teoretis komprehensif "
        "mengenai konsep pemesanan mandiri (self-ordering), cara kerja teknologi QR Code, antrean dapur First-In, First-Out (FIFO), "
        "sistem kasir POS dan pajak restoran PB1 (10%), arsitektur RESTful API, kerangka kerja Laravel 11, React 18 dengan "
        "TypeScript dan Tailwind CSS, basis data relasional MySQL 8.0, Data Flow Diagram (DFD), Entity Relationship Diagram (ERD), "
        "serta metode pengujian Black Box Testing."
    ))
    elems.append(p(
        "Bab III Metode Penelitian menyajikan metodologi rekayasa sistem yang diterapkan, mencakup identifikasi bahan atau data "
        "penelitian, spesifikasi perangkat keras dan perangkat lunak pendukung, prosedur pengumpulan data melalui observasi dan "
        "studi pustaka, analisis kebutuhan fungsional dan non-fungsional, perancangan terstruktur melalui DFD Level 0, DFD Level 1, "
        "dan DFD Level 2 pemesanan, perancangan konseptual ERD, perancangan fisik basis data 16 tabel relasional, serta perancangan "
        "antarmuka pengguna (user interface mockup)."
    ))
    elems.append(p(
        "Bab IV Implementasi dan Pembahasan memaparkan realisasi fisik sistem yang telah dibangun, meliputi implementasi antarmuka "
        "pemesanan mandiri pelanggan, antarmuka kasir POS, antarmuka Kitchen Display System (KDS) barista, antarmuka pengelolaan "
        "gudang, serta dashboard pemantauan owner. Selain itu, bab ini menyajikan hasil pengujian fungsionalitas sistem menggunakan "
        "metode Black Box Testing serta pembahasan komparatif terhadap efisiensi yang dicapai sistem."
    ))
    elems.append(p(
        "Bab V Penutup merangkum kesimpulan menyeluruh dari hasil penelitian yang secara langsung menjawab rumusan masalah dan "
        "tujuan yang telah ditetapkan, disertai saran-saran rekomendasi teknis yang konstruktif untuk pengembangan sistem "
        "pemesanan mandiri pada masa yang akan datang."
    ))
    
    return elems

print("thesis_content_bab1 defined successfully.")
