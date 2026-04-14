# Installation Guide

## Prasyarat

- **Node.js**: Minimal v18+.
- **Database**: MySQL Server (disarankan 8.0+ atau MariaDB setara). Eksekusi `mysql -u root -p`.
- **NPM/Yarn**: Termasuk dalam bundle Node.js.

## Instalasi Database

- Buat database MySQL bernama `peminjaman-buku` (bisa diubah dari `DB_NAME` pada `.env`).
- Import dump file SQL yang tersedia (Terdapat di folder `database/perpustakaan.sql`):

  ```bash
  mysql -u root -p peminjaman-buku < database/perpustakaan.sql
  ```

## Konfigurasi Backend Server

1. Masuk ke direktori `server/`.
2. Lakukan clone atau install modul Node.js:

   ```bash
   npm install
   ```

3. Sesuaikan `server/.env` untuk *credentials*:

   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=peminjaman-buku
   DB_DIALECT=mysql
   JWT_SECRET=secretpassword
   JWT_EXPIRE=1d
   CLIENT_URL=http://localhost:8080
   PORT=3000
   ```

4. Jalankan aplikasi Backend (Development):

   ```bash
   npm run dev      # Merekomendasikan menggunakan nodemon untuk auto-reload
   ```

   > [!NOTE]
   > Gunakan `npm start` hanya untuk pengujian standalone backend. Untuk production penuh, gunakan PM2 di root direktori (lihat bagian bawah).

## Konfigurasi Frontend Client

1. Masuk ke direktori `client/`.
2. Install dependensi modul:

   ```bash
   npm install
   ```

3. Ubah `.env` jika URL Backend berbeda (Secara bawaan menarget localhost:3000):

   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Jalankan aplikasi Frontend (Development):

   ```bash
   npm run dev
   ```

   Akses aplikasi melalui browser di `http://localhost:8080` (Atau port yang tertera pada CLI).

> [!TIP]
> Untuk production, frontend harus di-build terlebih dahulu agar dapat di-serve oleh Nginx.

## Akun Bawaan (Default Credentials)

Admin:
- Username: `admin1`
- Password: `admin123`

Untuk *User/Siswa* bisa didaftarkan memalui form Registrasi publik.

---

## Production Deployment (PM2 & Nginx)

Projek ini sudah dilengkapi dengan konfigurasi **PM2 (`ecosystem.config.js`)** untuk memudahkan pengelolaan proses di lingkungan production. Konfigurasi ini memungkinkan Anda menjalankan Backend dan Nginx secara bersamaan.

### 1. Persiapan Build (Wajib)

Sebelum menjalankan PM2, Anda harus melakukan build pada frontend agar file statis tersedia untuk Nginx:

1. Masuk ke folder `client/`.
2. Jalankan perintah build:

   ```bash
   npm run build
   ```

3. Pastikan folder `client/dist/` telah terbuat.

### 2. Prasyarat PM2

- Pastikan PM2 sudah terinstall di root direktori:

  ```bash
  npm install
  ```

  *(Dependensi PM2 sudah tertera pada root `package.json`)*

### 3. Perintah Operasional (Root Directory)

Anda dapat mengelola aplikasi langsung dari root direktori menggunakan script NPM yang sudah disediakan:

| Perintah | Deskripsi |
| :--- | :--- |
| `npm start` | Menjalankan Backend dan Nginx dalam mode production |
| `npm run dev` | Menjalankan stack dalam mode development |
| `npm stop` | Memberhentikan seluruh service |
| `npm restart` | Melakukan restart pada seluruh service |
| `npm run monitor` | Membuka dashboard monitoring server PM2 |

### 4. Detail Ekosistem

PM2 akan mengelola dua aplikasi utama berdasarkan `ecosystem.config.js`:

1. **peminjaman-buku-backend**: Berjalan di folder `server/` menggunakan environment `production`.
2. **peminjaman-buku-nginx**: Menjalankan instance Nginx dari folder `nginx/`.

---
