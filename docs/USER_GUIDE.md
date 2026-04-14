# Panduan Pengguna (User Guide)

Aplikasi Perpustakaan menampilkan 2 peran (Role) utama: **Admin** (Administrator Staff Perpustakaan) dan **User** (Siswa / Anggota).

## Model Penggunaan Aplikasi

Aplikasi ini dirancang untuk digunakan secara **face-to-face** (tatap muka) antara petugas perpustakaan (Admin) dan siswa di dalam lingkungan perpustakaan:

- **Admin/Petugas**: Menggunakan **PC/Laptop** untuk mengelola transaksi, validasi, dan pengaturan sistem.
- **Siswa/Anggota**: Menggunakan **PC atau Tablet** pada perangkat masing-masing di dalam perpustakaan untuk mencari buku, melakukan request peminjaman, perpanjangan, atau pengembalian.
- Interaksi fisik tetap diperlukan untuk serah terima buku dan pengecekan kondisi fisik buku oleh petugas.

## Navigasi Siswa
- **Registrasi & Login**: Anggota hanya bisa melakukan Login jika diberikan kredensial oleh admin dan hanya admin saja yang dapat membuat akun user/siswa.
- **Beranda (Dashboard) Siswa**: Tampilan riwayat peminjaman terbaru dan kondisi admin (*Offline / Online*).
- **Cari Buku**: Tab khusus untuk mencari buku. Jika stok = 0, siswa tidak dapat meminjam. Siswa juga tidak dapat meminjam ulang jika buku tersebut dilarang/masih ada riwayat *active* (dipinjam, terlambat, dsb).
- **Pinjam Buku & Kembali**: Aksi yang mewajibkan ketersediaan admin (toggled is_on_duty). Pada modul ini, siswa mengajukan permohonan dengan Status menjadi "**Req. Pinjam**" atau "**Req. Kembali**".
- **Perpanjangan**: Siswa yang ingin meminta perpanjangan pinjaman memicu notifikasi Socket yang langsung terkirim pada admin. Admin lalu menentukan durasi perpanjangan lewat *Settings* yang ada.

## Navigasi Administrator (Admin)
Admin bertugas memvalidasi *request* yang datang dari user secara Realtime.

### Status Berjaga (Toggle Online)
- Di bilah menu *Sidebar* bawah, admin dapat menemukan tombol tipe *switch* bertuliskan "**Status Berjaga**". Jika tombol ini **OFF**, semua siswa diblokir dari menambah/mengembalikan tiket peminjaman di platform mereka karena sistem menganggap "Petugas tidak di tempat". Fitur ini *realtime* di-push ke Web Socket siswa yang tengah meramban situs.

### Manajemen & Analitik
- **Buku & Kategori**: Admin menambahkan katalog buku dan menetapkan stok. Fasilitas unggah gambar menggunakan ekstensi file (Multipart Form Data).
- **Members**: Daftar blokir / ban siswa jika terindikasi meminjam bermasalah (Ubah status Active ke Suspended). Fitur CRUD penuh.
- **Settings**: Variabel *Dynamic* penentu harga denda per-kasus (Telat harian/flat, Hilang, Rusak sededang, dsb) hingga pengecualian hari denda.
- **Reports**: Dasbor statistik mencakup diagram batang per-status transaksi beserta tombol Ekspor hasil CSV *database array*.

### Proses *Approval*
Pada tab *Transaksi*, admin dapat menekan tombol Konfirm (*Checklist* atau *X*) setiap permohonan. Ketika Meng-*Reject*, admin *wajib* menyertakan alasan balasan yang dapat dibaca anggota.
Ketika memproses buku **Dikembalikan**, admin mengisi rating Kondisi (Rusak/Baik). Modul denda otomatis mencatatkan nominal uang yang tertagih ke siswa (Dapat disetel menjadi lunas nanti oleh admin dalam menu Riwayat).
