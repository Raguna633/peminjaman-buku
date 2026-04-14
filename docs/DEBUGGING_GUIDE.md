# Panduan Debugging — Aplikasi Perpustakaan Sekolah Digital

Dokumen ini berisi panduan untuk men-debug masalah umum, riwayat bug yang pernah diperbaiki, cara menjalankan unit test, dan tips troubleshooting untuk developer.

---

## 1. Cara Menjalankan Unit Test

### Persyaratan
- Node.js sudah terinstall (`node -v`)
- Database MySQL berjalan dan `.env` sudah dikonfigurasi

### Menjalankan Semua Test
```bash
cd server
npm test -- --run
```

### Menjalankan Test Satu File
```bash
# Contoh: hanya test BukuController
npm test server/tests/controllers/BukuController.test.js --run
```

### Melihat Coverage
```bash
npm run coverage
```

### Struktur Direktori Test
```
server/tests/
├── controllers/           # Test per controller
│   ├── AuthController.test.js
│   ├── BukuController.test.js
│   ├── KategoriController.test.js
│   ├── NotifikasiController.test.js
│   ├── SettingsController.test.js
│   ├── TransaksiController.test.js
│   └── UserController.test.js
├── helpers/               # Test helper/mock utilities
├── jobs/                  # Test cron jobs
├── middleware/            # Test autentikasi & otorisasi
├── models/                # Test model Sequelize
├── socket/                # Test Socket.IO events
├── utils/                 # Test utility functions
└── simple.test.js         # Smoke test dasar
```

### Membaca Output Test
```
✓ BukuController > getAllBuku > should return all books (15ms)    ← PASS
✗ BukuController > deleteBuku > should prevent deletion if transaction exists
  AssertionError: expected 409 but received 200                   ← FAIL
```

---

## 2. Riwayat Bug yang Pernah Diperbaiki

### Bug #1 — Sinkronisasi `is_on_duty` antar Koneksi Socket.IO
**Masalah:** Ketika admin melakukan toggle status berjaga, perubahan tidak langsung tercermin pada client siswa yang sudah terkoneksi. Siswa masih bisa melihat status "admin sedang berjaga" padahal sudah tidak.

**Root Cause:** Server tidak mem-broadcast perubahan `is_on_duty` ke semua socket yang terhubung — hanya mengembalikan response HTTP.

**Solusi:** Setelah update database berhasil, server emit event `admin:duty_status` ke seluruh room (broadcast global), bukan hanya ke room `admin`:
```js
// Di AuthController, setelah toggle
io.emit('admin:duty_status', { is_on_duty: newStatus, admin_id: req.user.id });
```

---

### Bug #2 — Race Condition: Approve Transaksi yang Sudah di-Reject
**Masalah:** Admin bisa secara tidak sengaja mengklik "approve" pada transaksi yang statusnya sudah `rejected`.

**Root Cause:** Tidak ada pengecekan status transaksi sebelum operasi approve dieksekusi.

**Solusi:** Tambahkan guard di awal setiap handler approve/reject:
```js
if (transaksi.status !== 'pending') {
  return res.status(400).json({
    success: false,
    message: `Transaksi tidak dapat diproses, status saat ini: ${transaksi.status}`
  });
}
```

---

### Bug #3 — Kalkulasi Denda Salah dengan Hari Libur yang Dikecualikan
**Masalah:** Ketika admin menambahkan tanggal pengecualian, sistem tidak mengurangi hari tersebut dari kalkulasi keterlambatan. Total denda tetap sama seolah tidak ada pengecualian.

**Root Cause:** Array `excluded_dates` yang dikirim client tidak di-parse dengan benar — diterima sebagai string JSON, bukan array.

**Solusi:** Tambahkan parsing eksplisit sebelum perhitungan:
```js
const excludedDates = typeof req.body.excluded_dates === 'string'
  ? JSON.parse(req.body.excluded_dates)
  : (req.body.excluded_dates || []);
```

---

### Bug #4 — Peminjaman Ulang Buku yang Status Transaksinya Masih Aktif
**Masalah:** Siswa bisa mengajukan peminjaman buku yang sama padahal transaksi sebelumnya belum selesai (misalnya status masih `approved` atau `overdue`).

**Root Cause:** Pengecekan duplikasi hanya melihat status `pending`, tidak mencakup semua status aktif lainnya.

**Solusi:** Ubah kondisi pengecekan duplikasi untuk mencakup semua status "aktif":
```js
const statusAktif = ['pending', 'approved', 'overdue', 'return_pending', 'extension_pending'];
const existing = await Transaksi.findOne({
  where: { user_id, buku_id, status: { [Op.in]: statusAktif } }
});
if (existing) {
  return res.status(409).json({ message: 'Kamu masih memiliki transaksi aktif untuk buku ini.' });
}
```

---

### Bug #5 — Stok Buku Tidak Berkurang/Bertambah dengan Benar
**Masalah:** Pada beberapa skenario, stok buku tidak berkurang saat peminjaman disetujui atau tidak bertambah saat pengembalian dikonfirmasi.

**Root Cause:** Operasi update stok tidak dibungkus dalam database transaction, sehingga jika ada error di tengah proses, stok bisa tidak sinkron dengan status transaksi.

**Solusi:** Bungkus semua operasi approve dalam `sequelize.transaction()`:
```js
await db.sequelize.transaction(async (t) => {
  await transaksi.update({ status: 'approved', ... }, { transaction: t });
  await buku.decrement('stok', { by: 1, transaction: t });
});
```

---

### Bug #6 — Buku Hilang: Stok Berkurang Dua Kali
**Masalah:** Ketika buku dinyatakan hilang (status `lost`), kemudian ditemukan dan diproses via `returnLost`, stok buku justru bertambah padahal stok sudah berkurang di `approvePeminjaman` dan tidak pernah bertambah lagi.

**Root Cause:** Pada alur normal `returned`, stok +1 dilakukan. Pada `returnLost`, logika ini awalnya dibungkus kondisi yang salah.

**Solusi:** Pastikan `returnLost` selalu increment stok jika kondisi buku tidak hilang, dan status diubah ke `returned`:
```js
// returnLost harus selalu increment stok
await buku.increment('stok', { by: 1 });
await transaksi.update({ status: 'returned', kondisi_buku, tanggal_kembali: new Date() });
```

---

## 3. Error Umum & Cara Mengatasinya

### ❌ `SequelizeConnectionError: connect ECONNREFUSED 127.0.0.1:3306`
**Penyebab:** MySQL tidak berjalan.

**Solusi:**
```bash
# Windows (XAMPP)
# Buka XAMPP Control Panel → Start MySQL

# Atau via services
net start mysql80
```

---

### ❌ `JsonWebTokenError: invalid signature` atau `TokenExpiredError`
**Penyebab:** Token expired atau `JWT_SECRET` di `.env` berubah.

**Solusi:**
1. Login ulang untuk mendapatkan token baru
2. Pastikan `JWT_SECRET` di `.env` konsisten dan tidak berubah

---

### ❌ `SequelizeValidationError: Validation error`
**Penyebab:** Data yang dikirim tidak sesuai constraint di model Sequelize.

**Solusi:** Periksa field yang error dari pesan error:
```
SequelizeValidationError: notNull Violation: Transaksi.status cannot be null
```
Pastikan request body menyertakan field wajib dengan nilai yang valid.

---

### ❌ Socket.IO tidak connect / `Authentication failed`
**Penyebab:** Token tidak disertakan pada saat koneksi socket, atau token sudah expired.

**Solusi di client:**
```js
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});
```

---

### ❌ `CORS Error` di browser
**Penyebab:** `CLIENT_URL` di `.env` server tidak sesuai dengan origin frontend.

**Solusi:** Sesuaikan nilai `CLIENT_URL` di `server/.env`:
```env
CLIENT_URL=http://localhost:5173
```

---

## 4. Checklist Troubleshooting Umum

Jika aplikasi tidak berjalan dengan benar, ikuti checklist ini secara berurutan:

- [ ] MySQL berjalan dan database `perpustakaan_digital` sudah ada
- [ ] File `server/.env` sudah diisi lengkap (`DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`, `CLIENT_URL`)
- [ ] `npm install` sudah dijalankan di folder `server/` dan `client/`
- [ ] Migrasi sudah dijalankan: `cd server && npx sequelize-cli db:migrate`
- [ ] Server backend berjalan di port 3000: `cd server && npm run dev`
- [ ] Client frontend berjalan di port 8080: `cd client && npm run dev`
- [ ] Tidak ada error di terminal server saat startup (cek koneksi DB dan port)
- [ ] Di browser, console tidak menampilkan error CORS atau Socket.IO auth failed

---

## 5. Environment Variables yang Diperlukan

File: `server/.env`

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=perpustakaan_digital

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=24h

# Client URL (untuk CORS dan Socket.IO)
CLIENT_URL=http://localhost:8080
```
