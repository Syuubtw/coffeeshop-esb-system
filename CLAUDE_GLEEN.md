# Konteks Proyek Skripsi: SPK Seleksi Atlet Esports Valorant

File ini adalah konteks untuk AI agent (Claude Code, Cursor, Copilot, dll.) yang membantu pengerjaan skripsi ini. Baca seluruhnya sebelum mulai bekerja. Bahasa komunikasi: **Bahasa Indonesia**.

---

## 1. Identitas

| Item | Isi |
|---|---|
| Mahasiswa (penulis skripsi) | Glen Maulana Jacobus |
| NIM | 235610016 |
| Program studi | Sistem Informasi |
| Fakultas | Teknologi Informasi (FTI) |
| Kampus | Universitas Teknologi Digital Indonesia (UTDI), Yogyakarta |
| Pendamping | Agung Dwi Pangestu ("Apguns"), teman sesama mahasiswa SI UTDI yang membantu |
| Gelar | Sarjana Komputer (S.Kom.) — perlu dikonfirmasi ke prodi |

**Judul:**
> Sistem Pendukung Keputusan Seleksi Atlet Esports Valorant Menggunakan Metode AHP dan TOPSIS (Studi Kasus: Gaming Garage Universitas Teknologi Digital Indonesia)

---

## 2. Aturan kerja untuk agent (WAJIB)

1. **Glen adalah penulis.** Ia menandatangani Pernyataan Keaslian Tugas Akhir dan harus mempertanggungjawabkan isi naskah serta kode saat sidang.
2. **Agent tidak menulis paragraf naskah untuk diserahkan sebagai karya Glen.** **Kode aplikasi Laravel boleh ditulis oleh agent**, dengan syarat: kode dibuat sederhana dan mudah dibaca, bagian AHP/TOPSIS diberi komentar yang merujuk ke langkah rumus di bagian 5, dan agent menjelaskan setiap bagian yang ditulis supaya Glen memahami dan bisa mempertanggungjawabkannya saat sidang. Yang juga boleh dan dianjurkan:
   - menjelaskan konsep, rumus, dan cara kerja (AHP, TOPSIS, Laravel, UML, dll.);
   - menyusun kerangka, panduan per paragraf, daftar periksa;
   - mencari dan memverifikasi referensi;
   - mengoreksi draf yang ditulis Glen (EYD, logika, konsistensi, kesesuaian template);
   - membantu debugging, mereview kode, menjelaskan error;
   - menyiapkan tabel data/struktur (mis. tabel perbandingan, daftar pustaka) dan latihan tanya-jawab sidang.
3. **Jangan mengarang fakta.** Data Gaming Garage (proses seleksi, jumlah pendaftar, kriteria, kutipan wawancara) hanya boleh berasal dari hasil wawancara/observasi nyata. Jika belum ada, tulis `[diisi dari wawancara]`.
4. **Jangan mengarang referensi.** Gunakan hanya jurnal yang sudah diverifikasi (bagian 7) atau yang baru dicek keberadaannya.
5. Data calon atlet wajib dianonimkan di naskah (A1, A2, …).

---

## 3. Latar belakang dan masalah

- **Gaming Garage UTDI** adalah komunitas esports kampus dengan divisi Mobile Legends, Free Fire, PES/eFootball, Valorant, dan Tekken 8.
- Open Recruitment Atlet Esports 2026: **9–30 November 2026**, pendaftaran **individu** (bukan per tim). Sumber: Instagram @gaminggarage.utdi. Istilah resmi mereka: **"atlet esports"**.
- Masalah (berdasarkan pengamatan pendamping, **belum dikonfirmasi wawancara**): seleksi masih berdasarkan minat, belum ada kriteria tertulis dan terukur, sehingga penilaian subjektif dan sulit membandingkan banyak pendaftar.
- Ruang lingkup: **hanya divisi Valorant**. Divisi lain masuk Saran (Bab V).
- Keputusan: kata "standarisasi" **tidak** dipakai di judul.

---

## 4. Keputusan teknis

| Aspek | Keputusan |
|---|---|
| Metode pembobotan | AHP (kuesioner perbandingan berpasangan diisi pengurus, CR ≤ 0,1) |
| Metode perangkingan | TOPSIS |
| Platform | Aplikasi web |
| Bahasa / framework | PHP + **Laravel** |
| Basis data | MySQL |
| Login | Laravel Breeze (disarankan) |
| Cetak laporan | `barryvdh/laravel-dompdf` (disarankan) |
| Pengujian | Black box testing, perbandingan hasil sistem vs keputusan pengurus (akurasi), System Usability Scale (SUS) |
| Metode pengembangan | **Belum diputuskan** (Waterfall atau Prototype) |

**Calon kriteria** (final setelah wawancara): C1 Rank, C2 ACS, C3 K/D ratio, C4 Headshot %, C5 Penguasaan role, C6 Komitmen latihan, C7 Komunikasi. Statistik dari tracker.gg dengan persetujuan pendaftar.

**Fitur aplikasi yang direncanakan:** login admin; dashboard; kelola kriteria; input matriks perbandingan AHP + tampilan bobot & CR; kelola data calon atlet dan nilainya; proses TOPSIS + ranking; cetak laporan; riwayat per periode rekrutmen.

**Usulan tabel database:** `users`, `kriteria`, `perbandingan_ahp`, `bobot`, `calon_atlet`, `nilai`, `hasil_topsis`, `periode`.

---

## 5. Rumus inti

**AHP**
1. Matriks perbandingan berpasangan, skala Saaty 1–9 (nilai kebalikan untuk sel simetris).
2. Normalisasi: bagi tiap elemen dengan jumlah kolomnya.
3. Bobot prioritas = rata-rata baris matriks ternormalisasi.
4. λmaks = rata-rata dari (A·w)ᵢ / wᵢ.
5. CI = (λmaks − n) / (n − 1); CR = CI / RI; konsisten jika CR ≤ 0,1.
6. RI (Saaty): n=1:0; 2:0; 3:0,58; 4:0,90; 5:1,12; 6:1,24; 7:1,32; 8:1,41; 9:1,45; 10:1,49.

**TOPSIS**
1. Matriks keputusan xᵢⱼ.
2. Normalisasi: rᵢⱼ = xᵢⱼ / √(Σᵢ xᵢⱼ²).
3. Terbobot: yᵢⱼ = wⱼ · rᵢⱼ (wⱼ dari AHP).
4. Solusi ideal A⁺ / A⁻: benefit → max/min; cost → min/max.
5. Dᵢ⁺ = √Σⱼ(yᵢⱼ − yⱼ⁺)², Dᵢ⁻ = √Σⱼ(yᵢⱼ − yⱼ⁻)².
6. Vᵢ = Dᵢ⁻ / (Dᵢ⁺ + Dᵢ⁻); ranking dari Vᵢ terbesar.

Hasil implementasi harus dicocokkan dengan perhitungan manual di Excel.

---

## 6. Ketentuan template FTI UTDI 2026

- A4, margin **atas 4 cm, kiri 4 cm, kanan 3 cm, bawah 3 cm**; Times New Roman 12 pt; spasi 1,5; isi tabel 10 pt spasi 1; intisari/abstract spasi 1.
- Bahasa Indonesia baku (EYD), **kalimat pasif**, tanpa "saya/kami"; istilah asing dicetak *miring*.
- Jangan memulai kalimat dengan kata hubung, angka, atau simbol.
- Sitasi nama–tahun: Ross (2004), (Lang, 2007), Nagle dkk. (2004).
- Judul tabel di **atas** tabel, judul gambar di **bawah** gambar; tengah, tebal, tanpa titik; penomoran Bab.urut (Tabel 2.1).
- Tinjauan pustaka: **minimal 5 artikel jurnal/prosiding**, ditelaah, bukan dikutip panjang.
- Intisari ≤ 250 kata, 3–4 paragraf, 3–5 kata kunci miring urut abjad; prakata ≤ 2 halaman.
- Studi kasus wajib melampirkan **surat pernyataan dari tempat penelitian** bahwa sistem digunakan di sana.

**Struktur bab:**
- **BAB I Pendahuluan:** 1.1 Latar Belakang, 1.2 Rumusan Masalah, 1.3 Ruang Lingkup (poin), 1.4 Tujuan, 1.5 Manfaat, 1.6 Sistematika Penulisan (paragraf).
- **BAB II Tinjauan Pustaka dan Dasar Teori:** 2.1 Tinjauan Pustaka, 2.2 Dasar Teori.
- **BAB III Metode Penelitian:** Bahan/Data, Peralatan, Prosedur dan Pengumpulan Data, Analisis dan Rancangan Sistem.
- **BAB IV Implementasi dan Pembahasan:** 4.1 Implementasi dan Uji Coba Sistem, 4.2 Pembahasan.
- **BAB V Penutup:** 5.1 Kesimpulan, 5.2 Saran.
- Daftar Pustaka, Lampiran (manual aplikasi, surat dari tempat penelitian, instrumen/kuesioner, transkrip wawancara).

---

## 7. Referensi terverifikasi

1. Buono, M. L. C., dan A. Latif. 2019. Implementasi Sistem Pendukung Keputusan Menggunakan Metode Analytic Hierarchy Process untuk Seleksi Pemain Futsal. *MUSTEK ANIM HA* 8(3). — AHP saja; tabel konsistensinya janggal (bisa jadi bahan kritik).
2. Hidayat, S., dan Yulianti. 2026. Sistem Penunjang Keputusan Menentukan Senjata Terbaik pada Komunitas VIC Menggunakan Perbandingan Metode SAW dan WP. *Biner* 4(3): 544–555. — SPK domain Valorant (objek senjata).
3. Mulya, A. A., dan W. Hadikurniawati. 2024. Sistem Pendukung Keputusan Pemilihan Laptop Gaming Menggunakan Metode AHP-TOPSIS. *Infotek* 7(2): 410–420. — opsional.
4. Nugroho, D. A., Z. Yunizar, dan L. Rosnita. 2026. Penerapan Metode Weighted Moving Average Peramalan pada Strategi Line Up Valorant. *JATI* 10(5). — memakai data tracker.gg.
5. Parmonangan S, T., M. A. Hasan, Walhidayat, dan F. Nasution. 2022. Decision Support System for the Selection of Pencak Silat Athletes Using AHP-TOPSIS. *ZONAsi: Jurnal Sistem Informasi* 4(1). — **paling relevan**.
6. Poluakan, M. M., L. Sitanayah, dan M. G. Sumampouw. 2026. Sistem Pendukung Keputusan Pemilihan Atlet Terbaik Menggunakan Metode TOPSIS. *Jurnal Ilmiah Realtech* 22(1). — TOPSIS tanpa AHP (pembeda).
7. Putra, I. P., R. K. Niswatin, dan A. Sanjaya. 2022. Perancangan Sistem Pendukung Keputusan Pemilihan Pemain Futsal Menggunakan Metode AHP dengan Pembobotan ROC. *Prosiding Seminar Nasional Inovasi Teknologi*, UN PGRI Kediri, hlm. 53–58.
8. Samsaudin, R., Y. A. Pranoto, dan M. Orisa. 2021. Implementasi Metode AHP dan TOPSIS untuk Penilaian Karyawan Baru di CV. Originality Group Berbasis Web. *JATI* 5(2). — contoh uji akurasi vs keputusan nyata.
9. Zidane, F. H., R. Hadiwiyanti, dan I. R. Mukhlis. 2026. Sistem Pendukung Keputusan Pemilihan Kandidat Pemagang Lowongan Marketing (Studi Kasus PT. Fleek Group Indonesia). *JATI* 10(3). — kriteria teknis + non-teknis.

**Gap penelitian:** AHP–TOPSIS sudah dipakai untuk seleksi atlet olahraga fisik, tetapi belum untuk atlet esports; penelitian Valorant yang ada membahas senjata dan lineup, bukan seleksi atlet.

---

## 8. Status naskah

File naskah: `Skripsi_Glen_Maulana_Jacobus_235610016.docx` (berbasis template resmi `2026_FTI_UTDI_Template_Tugas_Akhir-Skripsi.docx`).

| Bagian | Status |
|---|---|
| Sampul, halaman judul, pengesahan, pernyataan keaslian | Nama, NIM, prodi, fakultas, judul terisi; tahun, tanggal, nama penguji/pembimbing/Kaprodi kosong |
| Bab I | Panduan per subbab (stabilo kuning); paragraf belum ditulis |
| Bab II | Tabel 2.1 perbandingan penelitian terdahulu terisi (kolom penelitian sendiri sebagian `[diisi]`); subbab 2.2.1–2.2.9 dibuat; ulasan dan teori belum ditulis |
| Bab III | Panduan per bagian; Tabel 3.1 (kriteria, isi contoh) dan Tabel 3.2 (perangkat; PHP, Laravel, MySQL terisi tanpa versi) |
| Aplikasi `spk-valorant/` | Laravel 12 + Breeze + dompdf; CRUD kriteria/periode/calon, AHP (bobot disimpan hanya jika CR ≤ 0,1), TOPSIS, laporan PDF; 30 tes lolos (2026-11-19). Belum diuji dengan data nyata/Excel |
| Bab IV–V | Belum (menunggu sistem dibuat dan diuji) |
| Daftar Pustaka | 9 referensi di bagian 7 sudah dimasukkan |

Paragraf bertanda `[PANDUAN — hapus setelah diisi]` dan teks instruksi bawaan template (berwarna merah) harus dihapus setelah bagian tersebut ditulis.

---

## 9. Langkah berikutnya

1. Bimbingan dengan dospem: ajukan judul, tanyakan izin penelitian, metode pengembangan, dan minimal data.
2. Wawancara pengurus divisi Valorant Gaming Garage (selagi rekrutmen berjalan) + minta izin memakai data pendaftar dan kesediaan memberi surat keterangan.
3. Finalisasi kriteria, sebar kuesioner AHP, hitung bobot (CR ≤ 0,1) di Excel.
4. Glen menulis Bab I–III; agent mengoreksi per paragraf.
5. Pengembangan aplikasi Laravel (setup → migration → Breeze → CRUD → AHP → TOPSIS → laporan) oleh agent bersama Glen; agent menjelaskan tiap bagian agar Glen paham isinya.
6. Pengujian, lalu Bab IV–V, intisari/abstract, dan latihan sidang.
