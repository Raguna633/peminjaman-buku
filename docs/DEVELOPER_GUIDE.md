# Dokumentasi Pengembang & Referensi API

## Referensi API Standar (RESTful JSON)
Semua respons terangkai dalam struktur *schema* standar:
```json
{
  "success": boolean,
  "message": "Pesan status",
  "data": { ... payload yang disertakan ... }
}
```

### Modul Autentikasi (`/api/auth`)
| Method | Endpoint | Deskripsi | Authentication |
|---|---|---|---|
| `POST` | `/login` | Pertukaran Username+Password jadi *Bearer JWT*. | Public |
| `POST` | `/register` | Registrasi Siswa baru. | Public |
| `PUT` | `/duty-status` | Toggle kesiapan kerja admin `is_on_duty`. | Admin |

### Modul Transaksi (`/api/transaksi`)
*Flow-logic Transaksi berjalan dalam bentuk state-machine via requests API.*
| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/` | Muat semua data transaksi dengan populate buku & petugas. | Admin |
| `GET` | `/:id` | Muat rincian transaksi individu. | User / Admin |
| `POST` | `/request-peminjaman` | Pemanggilan user saat hendak meminjam buku. | User |
| `POST` | `/request-pengembalian` | Pemanggilan user saat hendak menitipkan buku untuk dikembalikan. | User |
| `POST` | `/:id/request-perpanjangan` | Meminta waktu ekstra peminjaman. | User |
| `PUT` | `/:id/approve-peminjaman` | Disetujui pinjaman, mengurangi `stok` dan set kalender `due`. | Admin |
| `PUT` | `/:id/reject-peminjaman` | Menolak permintaan. Harus mengirim string *reason*. | Admin |

### Web-Socket API (`Socket.io`)
Menghubungkan via `/` dengan otorisasi JWT.
- **Event Listeners (Client)**:
`admin:duty_status`, `transaction:request`, `pending:count`, `notification:new`.
- **Rooms**: `admin` & `user-[id]`.

## Panduan Perintah Lingkungan Dev
Pada terminal (*Terminal Bash / CMD*):
Ciptakan *migration* model:
Database secara *default* sudah tersetel agar melakukan `alter` saat Node Server berjalan dalam lingkungan **Development**. Pastikan ENV variabel memiliki `NODE_ENV=development` untuk melakukan inject kolom sql model secara dinamis saat merombak tabel model *Sequelize*. Jangan gunakan ini pada mode Produksi alias `NODE_ENV=production`.
