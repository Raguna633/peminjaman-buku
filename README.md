# Aplikasi Perpustakaan Sekolah Digital Berbasis Web

Aplikasi web modern untuk manajemen perpustakaan sekolah, dirancang guna memfasilitasi proses peminjaman, pengembalian buku, perpanjangan, dan pencatatan anggota perpustakaan secara digital. Aplikasi ini berjalan dalam jaringan lokal (*offline* / *localhost*) dan mendukung komunikasi realtime antara siswa dan petugas administrasi.

## Teknologi Utama
- **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Socket.IO Client, Recharts.
- **Backend**: Node.js, Express.js, Sequelize ORM, MySQL, Socket.IO.
- **Autentikasi**: JSON Web Token (JWT) & BcryptJS.

## Fitur Utama

### 🧑‍💼 Fitur Admin (Petugas)
- **Status Berjaga (Duty Status)**: Toggle ketersediaan Admin secara langsung. Ketika aktif, siswa dapat mengirimkan permohonan. Ketika offline, siswa diblokir dari meminta peminjaman atau pengembalian.
- **Manajemen Katalog**: Menambah, mengubah, menghapus data Buku dan Kategori. Mendukung upload gambar sampul buku (multipart/form-data).
- **Manajemen Transaksi**: Menyelesaikan permohonan Peminjaman, Pengembalian, dan Perpanjangan buku.
- **Kondisi Buku & Denda**: Mencatat kondisi buku saat dikembalikan (*Baik, Rusak Ringan, Sedang, Parah, Hilang*) dengan kalkulasi denda otomatis.
- **Laporan & Export**: Dasbor analitik interaktif (Recharts) untuk overview distribusi status transaksi dan total pengumpulan denda. Menyediakan Export CSV untuk laporan riwayat transaksi.
- **Pengaturan Modul**: Kustomisasi tarif denda harian/flat, batas pinjaman batas waktu buku, hingga pengecualian tanggal denda.

### 🎓 Fitur Siswa (Anggota)
- **Katalog Realtime**: Pencarian buku katalog dengan pencatatan ketersediaan stok aktual.
- **Request Peminjaman**: Memilih buku dan mengirim *Request* kepada admin. Akan diblokir jika tidak ada admin berjaga.
- **Pengembalian & Perpanjangan**: Meninjau buku pinjaman aktif dan mengajukan pengembalian (atau perpanjangan).
- **Notifikasi Live**: Menerima pembaruan status permohonan secara real-time dari Socket.IO melalui sistem notifikasi.

---

## Struktur Folder

```
/
├── client/              # Frontend (React + Vite)
├── server/              # Backend (Express + Node)
├── database/            # Skema SQL / Dump file
└── docs/                # Dokumentasi Proyek
```

Untuk instruksi instalasi, lihat `docs/INSTALLATION.md`.
Untuk panduan pengguna, lihat `docs/USER_GUIDE.md`.
