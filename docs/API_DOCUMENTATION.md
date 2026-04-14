# Dokumentasi API — Aplikasi Perpustakaan Sekolah Digital

> [!TIP]
> **Dokumentasi Interaktif (Swagger UI)**
> Anda dapat mengakses dokumentasi API yang lebih interaktif dan mendetail melalui Swagger UI di:
> `http://localhost:3000/api-docs`
>
> Di sana Anda dapat langsung mencoba (Try it out) semua endpoint yang tersedia.

Semua response HTTP mengikuti struktur standar:

```json
{
  "success": true | false,
  "message": "Pesan status dalam Bahasa Indonesia",
  "data": { ... }
}
```

**Base URL:** `http://localhost:3000/api`

**Autentikasi:** Header `Authorization: Bearer <JWT_TOKEN>` untuk semua endpoint bertanda 🔒.

---

## 1. Autentikasi (`/api/auth`)

### POST `/auth/register`

Registrasi akun siswa baru.

| | |
|---|---|
| **Auth** | Public |
| **Body** | `username` (3–50 char), `password` (min 6 char), `nama_lengkap`, `nis?`, `email?`, `phone?` |

**Response 201:**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": { "id": 5, "username": "siswa5", "role": "user", "token": "..." }
}
```

**Error:** `400` validasi gagal · `409` username sudah digunakan

---

### POST `/auth/login`

Login dan dapatkan JWT token.

| | |
|---|---|
| **Auth** | Public |
| **Body** | `username`, `password` |

**Response 200:**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": { "token": "eyJ...", "user": { "id": 1, "role": "admin", ... } }
}
```

**Error:** `400` validasi · `401` username/password salah · `401` akun tidak aktif

---

### GET `/auth/profile` 🔒

Dapatkan profil pengguna yang sedang login.

**Response 200:** Data user lengkap tanpa field `password`.

---

### PUT `/auth/duty-status` 🔒 Admin

Toggle status berjaga admin (`is_on_duty`). Jika aktif → nonaktif, dan sebaliknya.

**Response 200:**

```json
{
  "success": true,
  "message": "Status berjaga diperbarui",
  "data": { "is_on_duty": true }
}
```

Setelah toggle, server emit socket event `admin:duty_status` ke semua room.

---

### GET `/auth/check-duty`

Cek apakah ada admin yang sedang berjaga.

| | |
|---|---|
| **Auth** | Public |

**Response 200:**

```json
{ "success": true, "data": { "is_on_duty": true, "count": 1 } }
```

---

## 2. Buku (`/api/buku`)

### GET `/buku`

Dapatkan semua buku (dengan filter opsional).

| | |
|---|---|
| **Auth** | Public |
| **Query** | `search?`, `kategori_id?`, `page?`, `limit?` |

**Response 200:** Array buku dengan data kategori ter-include.

---

### GET `/buku/:id`

Detail satu buku.

| | |
|---|---|
| **Auth** | Public |

---

### POST `/buku` 🔒 Admin

Tambah buku baru. Mendukung upload sampul (`multipart/form-data`).

| | |
|---|---|
| **Auth** | Admin |
| **Content-Type** | `multipart/form-data` |
| **Body** | `judul*`, `pengarang*`, `penerbit*`, `tahun_terbit*`, `isbn*`, `kategori_id*`, `stok*`, `kondisi*`, `lokasi*`, `deskripsi?`, `sampul?` (file, maks 2MB) |

**Response 201:** Data buku yang baru dibuat.

---

### PUT `/buku/:id` 🔒 Admin

Update data buku (termasuk ganti sampul).

| | |
|---|---|
| **Auth** | Admin |
| **Content-Type** | `multipart/form-data` |

---

### DELETE `/buku/:id` 🔒 Admin

Hapus buku. **Tidak dapat dihapus jika memiliki riwayat transaksi.**

**Error:** `409` buku memiliki riwayat transaksi dan tidak dapat dihapus.

---

## 3. Kategori (`/api/kategori`)

### GET `/kategori` 🔒

Dapatkan semua kategori buku.

### GET `/kategori/:id` 🔒

Detail satu kategori.

### POST `/kategori` 🔒 Admin

Tambah kategori baru.

| **Body** | `nama*`, `deskripsi?` |
|---|---|

### PUT `/kategori/:id` 🔒 Admin

Update kategori.

### DELETE `/kategori/:id` 🔒 Admin

Hapus kategori (buku terkait: `kategori_id` → NULL).

---

## 4. Transaksi (`/api/transaksi`)

### GET `/transaksi` 🔒 Admin

Dapatkan semua transaksi beserta data user, buku, dan petugas.

| **Query** | `status?`, `page?`, `limit?`, `search?` |
|---|---|

---

### GET `/transaksi/user` 🔒

Dapatkan transaksi milik user yang sedang login.

---

### GET `/transaksi/:id` 🔒

Detail satu transaksi (user hanya bisa lihat milik sendiri).

---

### POST `/transaksi/request-peminjaman` 🔒 User

Ajukan permohonan peminjaman buku.

| **Body** | `buku_id*` (integer) |
|---|---|

**Validasi server:**

1. Ada admin berjaga (`is_on_duty = true`)
2. Kuota siswa belum penuh (`< max_borrow_limit`)
3. Tidak ada transaksi aktif buku yang sama (status: pending/approved/overdue/return_pending/extension_pending)
4. Stok buku > 0

**Response 201:** Data transaksi baru ber-status `pending`.

**Socket:** Emit `peminjaman:request` ke room `admin`.

---

### PUT `/transaksi/:id/approve-peminjaman` 🔒 Admin

Setujui permohonan peminjaman.

**Efek:**

- Status → `approved`
- `stok` buku -1
- `tanggal_pinjam` = now
- `tanggal_jatuh_tempo` = now + `borrow_duration_days`
- `petugas_id` = id admin

**Socket:** Emit `peminjaman:approved` ke room `user:<id_siswa>`.

---

### PUT `/transaksi/:id/reject-peminjaman` 🔒 Admin

Tolak permohonan peminjaman.

| **Body** | `rejection_reason*` (string) |
|---|---|

**Efek:** Status → `rejected`.

**Socket:** Emit `peminjaman:rejected` ke room `user:<id_siswa>`.

---

### POST `/transaksi/bulk-approve-peminjaman` 🔒 Admin

Approve banyak transaksi sekaligus.

| **Body** | `transaksi_ids*` (array of int) |
|---|---|

---

### POST `/transaksi/request-pengembalian` 🔒 User

Ajukan permohonan pengembalian buku.

| **Body** | `transaksi_id*` (integer) |
|---|---|

**Validasi:** Ada admin berjaga. Status transaksi harus `approved` atau `overdue`.

**Efek:** Status → `return_pending`.

**Socket:** Emit `pengembalian:request` ke room `admin`.

---

### POST `/transaksi/:id/kalkulasi-denda` 🔒 Admin

Preview kalkulasi denda **sebelum** melakukan approval pengembalian.

| **Body** | `kondisi_buku*` (baik\|rusak_ringan\|rusak_sedang\|rusak_parah\|hilang), `excluded_dates?` (YYYY-MM-DD[]) |
|---|---|

**Response 200:**

```json
{
  "data": {
    "denda_keterlambatan": 8000,
    "denda_kerusakan": 5000,
    "total_denda": 13000,
    "hari_terlambat": 8,
    "excluded_dates_applied": ["2026-03-17"]
  }
}
```

**Socket:** Emit `denda:preview` ke room `user:<id_siswa>` agar siswa bisa melihat nominal secara real-time.

---

### PUT `/transaksi/:id/approve-pengembalian` 🔒 Admin

Konfirmasi pengembalian buku.

| **Body** | `kondisi_buku*`, `denda` (auto-hitung) |
|---|---|

**Efek:**

- Status → `returned`
- `tanggal_kembali` = now
- `kondisi_buku` diset
- `stok` buku +1
- Kuota siswa +1
- Jika `kondisi_buku = 'hilang'`: stok tidak +1 (tetap berkurang permanen)

---

### PUT `/transaksi/:id/reject-pengembalian` 🔒 Admin

Tolak permohonan pengembalian (misalnya buku belum dibawa).

**Efek:** Status kembali ke `approved` atau `overdue` sesuai kondisi tanggal.

---

### POST `/transaksi/:id/bayar-denda` 🔒 Admin

Proses pembayaran denda untuk satu transaksi.

| **Body** | `jumlah_bayar*` (numeric) |
|---|---|

**Logic:**

- `denda_dibayar` += `jumlah_bayar`
- Jika `denda_dibayar >= denda` → lunas
- Jika `denda_dibayar < denda` → sisa masuk ke hutang siswa

**Socket:** Emit `denda:payment` ke `user:<id_siswa>`.

---

### POST `/transaksi/bulk-bayar-denda` 🔒 Admin

Proses pembayaran denda untuk beberapa transaksi sekaligus.

| **Body** | `transaksi_ids*` (array), `jumlah_bayar*`, `user_id*` |
|---|---|

---

### POST `/transaksi/:id/request-perpanjangan` 🔒 User

Ajukan permohonan perpanjangan masa pinjam.

**Validasi:** Ada admin berjaga. Status `approved` atau `overdue`. `extension_count < max_extensions`.

**Efek:** Status → `extension_pending`.

**Socket:** Emit `perpanjangan:request` ke room `admin`.

---

### PUT `/transaksi/:id/approve-perpanjangan` 🔒 Admin

Setujui perpanjangan.

**Efek:**

- Status → `approved`
- `tanggal_jatuh_tempo` += `borrow_duration_days`
- `extension_count` +1

**Socket:** Emit `perpanjangan:approved` ke `user:<id_siswa>`.

---

### PUT `/transaksi/:id/reject-perpanjangan` 🔒 Admin

Tolak perpanjangan. Status kembali ke `approved`/`overdue`.

---

### PUT `/transaksi/:id/return-lost` 🔒 Admin

Proses pengembalian untuk buku yang sebelumnya berstatus `lost` dan ditemukan kembali.

| **Body** | `kondisi_buku?` (baik\|rusak_ringan\|rusak_sedang\|rusak_parah) |
|---|---|

**Efek:**

- Status → `returned`
- `stok` buku +1
- `kondisi_buku` diset sesuai kondisi saat ditemukan

---

## 5. User (`/api/users`) 🔒 Admin

### GET `/users`

Dapatkan semua user. Query: `search?`, `role?`, `status?`, `page?`.

### GET `/users/:id`

Detail satu user.

### POST `/users`

Buat user baru (admin membuat akun siswa).

| **Body** | `username*`, `password*`, `nama_lengkap*`, `nis?`, `class?`, `email?`, `phone?`, `role*` |
|---|---|

### POST `/users/bulk`

Import banyak user dari CSV.

| **Body** | `users` (array of user objects) |
|---|---|

### PUT `/users/:id`

Update data user. Mendukung upload foto profil.

### DELETE `/users/:id`

Hapus user. Tidak dapat dihapus jika memiliki transaksi aktif.

---

## 6. Settings (`/api/settings`) 🔒 Admin

### GET `/settings`

Dapatkan semua pengaturan aplikasi.

### PUT `/settings`

Update pengaturan. Body berisi field-field Settings yang ingin diubah.

| **Field yang bisa diubah** | Tipe |
|---|---|
| `max_borrow_limit` | integer (1–10) |
| `borrow_duration_days` | integer (1–30) |
| `allow_extension` | boolean |
| `max_extensions` | integer (0–5) |
| `max_denda_amount` | integer ≥ 0 |
| `denda_type` | `"flat"` \| `"per_day"` |
| `denda_per_day_amount` | integer ≥ 0 |
| `denda_flat_amount` | integer ≥ 0 |
| `denda_kerusakan_ringan` | integer ≥ 0 |
| `denda_kerusakan_sedang` | integer ≥ 0 |
| `denda_kerusakan_parah` | integer ≥ 0 |
| `denda_hilang` | integer ≥ 0 |
| `excluded_denda_dates` | `string[]` (YYYY-MM-DD) |
| `reminder_days_before_due` | integer (0–7) |
| `shelf_locations` | `string[]` |
| `kelas_list` | `string[]` |

---

## 7. Notifikasi (`/api/notifikasi`) 🔒

### GET `/notifikasi`

Dapatkan notifikasi milik user yang sedang login. Query: `is_read?`, `limit?`.

### PUT `/notifikasi/:id/read`

Tandai satu notifikasi sebagai sudah dibaca.

### PUT `/notifikasi/read-all`

Tandai semua notifikasi sebagai sudah dibaca.

---

## 8. Socket.IO Events

### Koneksi

```
URL  : ws://localhost:5000
Auth : { auth: { token: "<JWT>" } }
```

Setelah connect, server otomatis bergabungkan user ke room:

- Admin  → room `admin`
- Siswa  → room `user:<id>`

---

### Events yang dikirim SERVER → CLIENT

| Event | Target | Payload | Keterangan |
|---|---|---|---|
| `pending:count` | Admin | `{ peminjaman, pengembalian, perpanjangan, total }` | Jumlah request pending saat admin connect |
| `admin:duty_status` | Semua | `{ is_on_duty: bool, admin_id }` | Broadcast saat toggle duty status |
| `admin:duty_status_init` | Siswa | `{ is_on_duty: bool }` | Status berjaga awal saat siswa connect |
| `notifications:unread` | Siswa | `{ notifications[], count }` | Notif belum dibaca saat siswa connect |
| `transactions:pending` | Siswa | `Transaksi[]` | Transaksi dengan status aktif milik siswa |
| `peminjaman:request` | Admin | `{ transaksi, user, buku }` | Ada request peminjaman masuk |
| `peminjaman:approved` | Siswa | `{ transaksi }` | Peminjaman siswa disetujui |
| `peminjaman:rejected` | Siswa | `{ transaksi, reason }` | Peminjaman siswa ditolak |
| `pengembalian:request` | Admin | `{ transaksi, user, buku }` | Ada request pengembalian masuk |
| `pengembalian:approved` | Siswa | `{ transaksi }` | Pengembalian disetujui |
| `perpanjangan:request` | Admin | `{ transaksi, user, buku }` | Ada request perpanjangan masuk |
| `perpanjangan:approved` | Siswa | `{ transaksi }` | Perpanjangan disetujui |
| `denda:preview` | Siswa | `{ denda_keterlambatan, denda_kerusakan, total_denda }` | Preview denda real-time |
| `denda:payment` | Siswa | `{ denda_dibayar, sisa_denda }` | Update status pembayaran |
| `notification:new` | Siswa | `Notifikasi` | Notifikasi baru masuk |
| `notification:read:success` | Siswa | `notificationId` | Konfirmasi notif berhasil ditandai dibaca |
| `notifications:read_all:success` | Siswa | — | Semua notif berhasil ditandai dibaca |
| `pong` | Pengirim | `{ timestamp }` | Response dari event `ping` |

---

### Events yang dikirim CLIENT → SERVER

| Event | Payload | Keterangan |
|---|---|---|
| `notification:read` | `notificationId` | Tandai satu notif sebagai dibaca |
| `notifications:read_all` | — | Tandai semua notif sebagai dibaca |
| `ping` | — | Cek koneksi aktif |

---

## 9. Utility Functions & Internal Services

### `settingsCache.js`

Modul singleton untuk caching Settings agar tidak query database setiap request.

| Fungsi | Keterangan |
|---|---|
| `loadSettings()` | Load settings dari DB saat startup; buat default jika belum ada |
| `getCachedSettings()` | Kembalikan settings dari cache (synchronous) |
| `refreshSettings()` | Reload settings dari DB dan perbarui cache |

### Cron Job: Overdue Checker

Berjalan terjadwal (setiap hari / interval tertentu) untuk mengubah status transaksi `approved` yang tanggal jatuh temponya sudah lewat menjadi `overdue`. Juga mengirim notifikasi reminder (`overdue_reminder`) ke siswa berdasarkan `reminder_days_before_due`.

### Kalkulasi Denda (dalam `TransaksiController`)

Logika kalkulasi denda dijalankan pada endpoint `POST /:id/kalkulasi-denda`:

1. Hitung hari keterlambatan = selisih `tanggal_kembali` (atau hari ini) − `tanggal_jatuh_tempo`
2. Kurangi hari yang masuk ke `excluded_denda_dates`
3. Jika `denda_type = 'per_day'`: `denda_keterlambatan = hari × denda_per_day_amount`
4. Jika `denda_type = 'flat'`: `denda_keterlambatan = denda_flat_amount` (jika terlambat)
5. Tambah `denda_kerusakan` berdasarkan `kondisi_buku`
6. Cap dengan `max_denda_amount`: `total = min(denda_keterlambatan + denda_kerusakan, max_denda_amount)`

> **Catatan:** Jika tanggal jatuh tempo jatuh pada hari libur (`excluded_denda_dates`), maka batas waktu bergeser ke hari kerja berikutnya.
