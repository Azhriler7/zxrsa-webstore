# 📄 Dokumentasi Produk: Web Marketplace Akun Premium

## 1. Gambaran Umum
Sistem ini merupakan platform e-commerce produk digital yang dirancang khusus untuk transaksi jual beli akun aplikasi premium (seperti Netflix, CapCut, Alight Motion, Wing, dan sejenisnya). Platform ini menggabungkan antarmuka pembeli yang modern dan responsif dengan dashboard admin otomatis untuk pengelolaan stok kredensial serta integrasi pembayaran instan.

---

## 2. Tujuan Utama Sistem
* **Proses Checkout Instan:** Memungkinkan pembelian langsung baik sebagai *Guest* (tanpa akun) maupun pengguna terdaftar.
* **Otomatisasi Stok:** Mengintegrasikan *payment gateway* (Midtrans) dengan sistem pengeluaran stok akun secara otomatis setelah pembayaran terverifikasi.
* **Transparansi & Bukti Transaksi:** Menyediakan kartu kredensial digital yang dapat diunduh sebagai gambar serta pengiriman nota otomatis ke email pembeli.
* **Efisiensi Pengelolaan Admin:** Memudahkan penjual memantau arus kas, mengelola katalog produk/promo, dan memasukkan stok kredensial secara massal.

---

## 3. Spesifikasi Design System & UI/UX
* **Dukungan Light/Dark Mode:** Tampilan adaptif yang nyaman di mata dengan tombol alih mode terang dan gelap.
* **Desain Responsif:** Optimal di layar Komputer/Desktop (1440px) dan Telepon Genggam/Mobile (390px).
* **Palet Warna & Tipografi:**
  * **Warna Utama:** *Indigo / Electric Blue* (`#6366F1`) — memberikan kesan modern dan terpercaya.
  * **Warna Aksen:** *Emerald Green* (`#10B981`) — indikator stok, diskon, dan Promo Jumat.
  * **Font:** *Plus Jakarta Sans* atau *Inter*.

---

## 4. Struktur Halaman & Spesifikasi Fitur

### A. Antarmuka Pengguna (UI User)

1. **Halaman Utama (Homepage):**
   * **Header Navigasi:** Logo toko, bilah pencarian produk, *toggle* Light/Dark mode, serta tombol login/riwayat.
   * **Hero Banner:** Promo khusus (seperti *Promo Jumat Berkah*) dilengkapi penghitung waktu mundur (*countdown timer*).
   * **Katalog Produk (Card Grid):** Menampilkan logo aplikasi, rating bintang, harga mulai dari, dan status ketersediaan stok.
   * **Bagian Ulasan & Footer:** Ulasan pembeli, informasi garansi, dan tombol bantuan Layanan Pelanggan (CS WhatsApp).

2. **Modal Checkout / Pembelian:**
   * **Pilihan Tipe Akun:** Akun Siap Pakai (*Ready*) atau Aktivasi *Custom Gmail*.
   * **Pilihan Durasi Paket:** Pilihan fleksibel (1 Bulan, 3 Bulan, 1 Tahun) beserta indikator stok *real-time*.
   * **Formulir Input:** Kolom email penerima nota dan email *custom* (jika memilih paket Gmail).
   * **Ringkasan Pembayaran:** Subtotal, kolom kode promo, dan tombol pembayaran langsung terintegrasi ke Midtrans Snap.

3. **Halaman Pengiriman Akun & Nota (Delivery Page):**
   * **Konfirmasi Transaksi:** Lencana status pembayaran berhasil beserta Order ID.
   * **Kartu Kredensial Digital:** Tampilan email, kata sandi, PIN, dan tanggal kadaluarsa lengkap dengan tombol salin satu-klik (*1-Click Copy*).
   * **Fungsi Simpan Gambar:** Tombol *"Simpan Kartu sebagai Gambar"* untuk pembeli mode *Guest*.
   * **Aturan & Garansi:** Poin-poin aturan penggunaan akun dan tombol klaim garansi langsung ke WhatsApp CS.

4. **Halaman Riwayat Pembelian (User Profile):**
   * Daftar transaksi sebelumnya, status pembayaran (*Paid/Expired*), dan tombol untuk membuka kembali kartu kredensial.

5. **Modal Rating & Ulasan:**
   * Formulir penilaian 1–5 bintang dan kolom tanggapan pengalaman pembeli.

---

### B. Antarmuka Pengelola (UI Admin)

1. **Dashboard Analitik:**
   * **Kartu Metrik Utama:** Total pendapatan harian/bulanan (tersinkronisasi dengan Midtrans), total akun terjual, dan peringatan stok kritis.
   * **Grafik Visual:** Grafik tren penjualan dan perbandingan produk terlaris.

2. **Manajemen Produk & Promo (CRUD Card):**
   * **Tabel Produk:** Daftar seluruh produk, kategori, variasi harga, dan status aktif/nonaktif.
   * **Formulir Tambah/Edit Produk:** Unggah logo, tambah variasi paket, dan tombol aktivasi *Promo Jumat*.

3. **Manajemen Stok Kredensial (Account Pool):**
   * **Input Massal:** Kolom teks untuk memasukkan stok akun sekaligus (format: `email|password|pin`).
   * **Tabel Status Stok:** Memantau status kredensial (*Ready*, *Terjual*, *Flagged/Garansi*).

4. **Log Transaksi & Pembayaran:**
   * Riwayat transaksi lengkap dari Midtrans, status pembayaran (*Settlement/Pending*), serta opsi kirim ulang nota email atau penggantian akun garansi.

---

## 5. Alur Kerja Utama Sistem (Workflow)
[PEMBELI]
Homepage ➔ Pilih Produk ➔ Pilih Paket & Isi Email ➔ Bayar via Midtrans ➔ Terima Akun & Simpan Gambar Kartu

[ADMIN]
Terima Pembayaran Midtrans ➔ Sistem Melepas Stok Akun Otomatis ➔ Dashboard Analitik Terperbarui