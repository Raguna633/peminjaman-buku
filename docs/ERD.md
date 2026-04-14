# Entity Relationship Diagram (ERD)
## Perpustakaan Sekolah Digital

Dokumen ini mendeskripsikan struktur basis data dan hubungan antar entitas dalam aplikasi Perpustakaan Sekolah Digital.

---

### Visual Diagram

Diagram berikut mencakup semua tabel utama dan relasinya. Hubungan digambarkan menggunakan notasi *Crow's Foot*.

```mermaid
erDiagram
    %% Entities
    SETTINGS {
        int id PK
        int max_borrow_limit "Limit Pinjam"
        int borrow_duration_days "Durasi Pinjam"
        boolean allow_extension "Izin Perpanjang"
        int max_extensions "Max Perpanjang"
        int max_denda_amount "Batas Denda"
        string denda_type "flat | per_day"
        int denda_per_day_amount
        int denda_flat_amount
        int denda_kerusakan_ringan
        int denda_kerusakan_sedang
        int denda_kerusakan_parah
        int denda_hilang
        json excluded_denda_dates
        int reminder_days_before_due
        json shelf_locations
        datetime created_at
        datetime updated_at
    }

    USERS {
        int id PK
        string username "Unique"
        string nama_lengkap
        string nis "Unique (User Only)"
        string email
        string role "admin | user"
        string password "BCrypt Hash"
        string foto "Path/Filenames"
        string status "active | inactive"
        boolean is_on_duty "Hanya Admin"
        datetime created_at
        datetime updated_at
    }

    KATEGORI {
        int id PK
        string nama "Unique"
        text deskripsi
        datetime created_at
        datetime updated_at
    }

    BUKU {
        int id PK
        string judul
        string pengarang
        string penerbit
        int tahun_terbit
        string isbn "Unique"
        int kategori_id FK "Relasi ke Kategori"
        int stok
        string kondisi
        string lokasi "Rak ID"
        text deskripsi
        string sampul "Path/Filename"
        datetime created_at
        datetime updated_at
    }

    TRANSAKSI {
        int id PK
        int user_id FK "Peminjam"
        int buku_id FK "Buku"
        string status "Enum Status"
        datetime tanggal_pinjam
        datetime tanggal_jatuh_tempo
        datetime tanggal_kembali
        string kondisi_buku "Saat Kembali"
        int extension_count
        int denda
        int denda_dibayar
        text rejection_reason
        int petugas_id FK "Admin Approved"
        datetime created_at
        datetime updated_at
    }

    NOTIFIKASI {
        int id PK
        int user_id FK "Penerima"
        string title
        text message
        string type "Status Notif"
        int transaksi_id FK "Optional"
        boolean is_read
        datetime created_at
        datetime updated_at
    }

    %% Relationships
    KATEGORI ||--o{ BUKU : "mengelompokkan"
    BUKU ||--o{ TRANSAKSI : "terlibat dalam"
    USERS ||--o{ TRANSAKSI : "melakukan pinjam"
    USERS ||--o{ TRANSAKSI : "memproses as admin"
    USERS ||--o{ NOTIFIKASI : "menerima"
    TRANSAKSI ||--o{ NOTIFIKASI : "memicu"
```

---

### Detail Relasi

| Relasi | Tipe Hubungan | Deskripsi Teknis |
| :--- | :---: | :--- |
| **Kategori ↔ Buku** | `1 : N` | Satu kategori dapat berisi banyak buku. Menghapus kategori akan men-set `kategori_id` buku menjadi `NULL`. |
| **Buku ↔ Transaksi** | `1 : N` | Satu buku dapat dipinjam berkali-kali secara historis. Transaksi merekam status unik peminjaman. |
| **Users ↔ Transaksi** | `1 : N` | User sebagai "Peminjam" (user_id) dan Admin sebagai "Petugas" (petugas_id) yang memvalidasi. |
| **Users ↔ Notifikasi** | `1 : N` | Setiap notifikasi ditujukan kepada user tertentu. Menghapus user akan menghapus seluruh notifikasinya. |
| **Transaksi ↔ Notifikasi** | `1 : N` | Notifikasi seringkali dipicu oleh perubahan status pada transaksi tertentu. |

###  Alur Status (Workflow)

Perjalanan status sebuah buku dari peminjaman hingga pengembalian:

1. **PENGAJUAN**: `pending` (Menunggu Approval Admin)
2. **AKTIF**:
   - `approved` (Buku sedang dipinjam)
   - `overdue` (Terlambat dikembalikan - Sistem Auto-check)
   - `extension_pending` (Menunggu Approval Perpanjangan)
3. **SELESAI**:
   - `returned` (Kembali - Baik/Rusak)
   - `rejected` (Ditolak Admin)
   - `lost` (Dinyatakan Hilang)

> [!NOTE]
> Sistem memblokir peminjaman baru jika user masih memiliki transaksi berstatus **AKTIF** untuk buku yang sama.

---

### Catatan Teknis Database

- **Engine**: MySQL 8.0 / MariaDB
- **ORM**: Sequelize (dengan Migrations)
- **Soft Deletes**: Tidak digunakan untuk menjaga integritas data transaksi, record dihapus secara permanen atau dinonaktifkan via field `status`.
- **Audit**: Field `created_at` dan `updated_at` tersedia di semua tabel untuk pelacakan waktu.

---

###  Referensi Status (Quick Lookup)

- **Status "aktif"** (mencegah peminjaman buku yang sama): `pending`, `approved`, `overdue`, `return_pending`, `extension_pending`
- **Status "selesai"** (boleh meminjam buku yang sama lagi): `returned`, `rejected`, `lost`
