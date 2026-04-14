-- =============================================================
-- Aplikasi Perpustakaan Sekolah Digital
-- Database: perpustakaan_digital
-- Engine: MySQL 8.0+  |  Charset: utf8mb4
-- Dibuat: 2026-03-30
--
-- CARA RESTORE:
--   mysql -u root -p perpustakaan_digital < perpustakaan.sql
--
-- CATATAN:
--   File ini mencakup schema lengkap + data seed representatif.
--   Pastikan database sudah dibuat sebelum menjalankan restore:
--     CREATE DATABASE IF NOT EXISTS perpustakaan_digital
--       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- =============================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- =============================================================
-- 1. SequelizeMeta — tabel internal migrasi Sequelize
-- =============================================================

DROP TABLE IF EXISTS `SequelizeMeta`;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

INSERT INTO `SequelizeMeta` VALUES
  ('20260202022409-create-user.js'),
  ('20260209042350-create-settings.js'),
  ('20260209095000-create-buku.js'),
  ('20260209100500-create-kategori.js'),
  ('20260209102000-add-kategori-fk-to-buku.js'),
  ('20260209104000-create-transaksi.js'),
  ('20260209110000-create-notifikasi.js'),
  ('20260218090000-alter-transaksi-core-flow.js'),
  ('20260222120000-add-extension-to-transaksi.js'),
  ('20260226090000-add-user-status-and-kondisi-buku.js');

-- =============================================================
-- 2. Settings — konfigurasi global aplikasi (singleton, id=1)
-- =============================================================

DROP TABLE IF EXISTS `Settings`;
CREATE TABLE `Settings` (
  `id`                      int          NOT NULL AUTO_INCREMENT,
  `max_borrow_limit`        int          NOT NULL DEFAULT '3'       COMMENT 'Maks buku yang bisa dipinjam per siswa',
  `borrow_duration_days`    int          NOT NULL DEFAULT '7'       COMMENT 'Durasi peminjaman default (hari)',
  `allow_extension`         tinyint(1)   NOT NULL DEFAULT '1'       COMMENT 'Izinkan perpanjangan',
  `max_extensions`          int          NOT NULL DEFAULT '1'       COMMENT 'Maks jumlah perpanjangan',
  `max_denda_amount`        int          NOT NULL DEFAULT '50000'   COMMENT 'Batas maksimal akumulasi denda (Rp)',
  `denda_type`              enum('flat','per_day') NOT NULL DEFAULT 'per_day',
  `denda_per_day_amount`    int          NOT NULL DEFAULT '1000'    COMMENT 'Denda per hari keterlambatan (Rp)',
  `denda_flat_amount`       int          NOT NULL DEFAULT '5000'    COMMENT 'Denda flat keterlambatan (Rp)',
  `denda_kerusakan_ringan`  int          NOT NULL DEFAULT '5000'    COMMENT 'Denda buku rusak ringan (Rp)',
  `denda_kerusakan_sedang`  int          NOT NULL DEFAULT '10000'   COMMENT 'Denda buku rusak sedang (Rp)',
  `denda_kerusakan_parah`   int          NOT NULL DEFAULT '15000'   COMMENT 'Denda buku rusak parah (Rp)',
  `denda_hilang`            int          NOT NULL DEFAULT '50000'   COMMENT 'Denda buku hilang (Rp)',
  `excluded_denda_dates`    json         NOT NULL                   COMMENT 'Tanggal pengecualian denda (YYYY-MM-DD[])',
  `reminder_days_before_due` int         NOT NULL DEFAULT '2'       COMMENT 'Hari sebelum jatuh tempo untuk kirim reminder',
  `shelf_locations`         json         NOT NULL                   COMMENT 'Daftar lokasi rak buku',
  `kelas_list`              json         NOT NULL                   COMMENT 'Daftar nama kelas',
  `created_at`              datetime     NOT NULL,
  `updated_at`              datetime     NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Settings` VALUES (
  1, 3, 7, 1, 1, 50000, 'per_day', 1000, 5000, 5000, 10000, 15000, 50000,
  '[]',
  2,
  '["Rak A1", "Rak A2", "Rak B1", "Rak B2", "Rak C1", "Rak C2"]',
  '["X PPLG 1","X PPLG 2","X PPLG 3","X APL 1","X APL 2","X APL 3","X MPLB 1","X MPLB 2","X MPLB 3","XI PPLG 1","XI PPLG 2","XI PPLG 3","XI APL 1","XI APL 2","XI APL 3","XI MPLB 1","XI MPLB 2","XI MPLB 3","XII PPLG 1","XII PPLG 2","XII PPLG 3","XII APL 1","XII APL 2","XII APL 3","XII MPLB 1","XII MPLB 2","XII MPLB 3"]',
  '2026-01-01 07:00:00', '2026-03-30 08:00:00'
);

-- =============================================================
-- 3. Users — admin dan siswa
-- =============================================================
-- Password admin  : admin123 (bcrypt hash)
-- Password siswa  : siswa123 (bcrypt hash)

DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `username`     varchar(255) DEFAULT NULL,
  `nama_lengkap` varchar(255) DEFAULT NULL,
  `class`        varchar(255) DEFAULT NULL    COMMENT 'Kelas siswa (null untuk admin)',
  `nis`          varchar(255) DEFAULT NULL    COMMENT 'Nomor Induk Siswa (null untuk admin)',
  `email`        varchar(255) DEFAULT NULL,
  `role`         varchar(255) DEFAULT NULL    COMMENT 'admin | user',
  `phone`        varchar(255) DEFAULT NULL,
  `password`     varchar(255) DEFAULT NULL,
  `foto`         varchar(255) DEFAULT NULL,
  `status`       varchar(255) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `is_on_duty`   tinyint(1)   NOT NULL DEFAULT '0' COMMENT 'Status berjaga admin (true = sedang berjaga)',
  `created_at`   datetime     NOT NULL,
  `updated_at`   datetime     NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Users` VALUES
-- Admin (id 1-2)
(1, 'admin1',  'Budi Santoso',       NULL,         NULL,      'admin1@perpustakaan.sch.id', 'admin', '081234567890',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', NULL, 'active', 1,
 '2026-01-02 07:00:00', '2026-03-30 08:00:00'),
(2, 'admin2',  'Siti Rahayu',        NULL,         NULL,      'admin2@perpustakaan.sch.id', 'admin', '081234567891',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', NULL, 'active', 0,
 '2026-01-02 07:00:00', '2026-03-30 08:00:00'),
-- Siswa (id 3-8)
(3, 'siswa1',  'Ahmad Rizky Pratama','X PPLG 1',  '20240001', 'siswa1@siswa.sch.id',        'user',  '085700000001',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'active',  0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00'),
(4, 'siswa2',  'Dewi Anggraeni',     'X PPLG 1',  '20240002', 'siswa2@siswa.sch.id',        'user',  '085700000002',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'active',  0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00'),
(5, 'siswa3',  'Fajar Nugroho',      'XI APL 2',  '20240003', 'siswa3@siswa.sch.id',        'user',  '085700000003',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'active',  0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00'),
(6, 'siswa4',  'Lestari Wulandari',  'XI APL 2',  '20240004', 'siswa4@siswa.sch.id',        'user',  '085700000004',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'active',  0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00'),
(7, 'siswa5',  'Rendi Kurniawan',    'XII MPLB 1','20240005', 'siswa5@siswa.sch.id',        'user',  '085700000005',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'active',  0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00'),
(8, 'siswa6',  'Maya Sari',          'XII MPLB 1','20240006', 'siswa6@siswa.sch.id',        'user',  '085700000006',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p16tquZnA0jBv6C8IQBo.', NULL, 'inactive', 0,
 '2026-01-10 07:30:00', '2026-03-30 08:00:00');

-- =============================================================
-- 4. Kategori — kategori buku
-- =============================================================

DROP TABLE IF EXISTS `Kategori`;
CREATE TABLE `Kategori` (
  `id`         int          NOT NULL AUTO_INCREMENT,
  `nama`       varchar(255) DEFAULT NULL,
  `deskripsi`  text,
  `created_at` datetime     NOT NULL,
  `updated_at` datetime     NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Kategori` VALUES
(1, 'Fiksi',           'Novel, cerpen, dan karya sastra imajinatif',              '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
(2, 'Non-Fiksi',       'Buku faktual: biografi, sejarah, sains populer',          '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
(3, 'Sains & Teknologi','Matematika, fisika, informatika, dan rekayasa',           '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
(4, 'Sosial & Budaya', 'Sosiologi, antropologi, kesenian, dan kewarganegaraan',   '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
(5, 'Referensi',       'Kamus, ensiklopedia, atlas, dan buku teks pelajaran',     '2026-01-05 08:00:00', '2026-01-05 08:00:00');

-- =============================================================
-- 5. Buku — koleksi buku perpustakaan
-- =============================================================

DROP TABLE IF EXISTS `Buku`;
CREATE TABLE `Buku` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `judul`        varchar(255) DEFAULT NULL,
  `pengarang`    varchar(255) DEFAULT NULL,
  `penerbit`     varchar(255) DEFAULT NULL,
  `tahun_terbit` int          DEFAULT NULL,
  `isbn`         varchar(255) DEFAULT NULL,
  `kategori_id`  int          DEFAULT NULL,
  `stok`         int          DEFAULT NULL,
  `kondisi`      varchar(255) DEFAULT NULL COMMENT 'kondisi fisik umum buku: baik | cukup | buruk',
  `lokasi`       varchar(255) DEFAULT NULL COMMENT 'Lokasi rak, contoh: Rak A1',
  `deskripsi`    text,
  `sampul`       varchar(255) DEFAULT NULL,
  `created_at`   datetime     NOT NULL,
  `updated_at`   datetime     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_buku_kategori_id` (`kategori_id`),
  CONSTRAINT `fk_buku_kategori_id` FOREIGN KEY (`kategori_id`) REFERENCES `Kategori` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Buku` VALUES
(1,  'Bumi Manusia',              'Pramoedya Ananta Toer', 'Hasta Mitra',       1980, '978-979-696-000-1', 1, 4, 'baik',  'Rak A1', 'Novel sejarah tentang Minke di era kolonial Belanda.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(2,  'Laskar Pelangi',            'Andrea Hirata',         'Bentang Pustaka',   2005, '978-979-8640-41-6', 1, 5, 'baik',  'Rak A1', 'Kisah inspiratif 10 anak di Belitong yang berjuang untuk pendidikan.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(3,  'Filosofi Teras',            'Henry Manampiring',     'Kompas',            2018, '978-602-412-394-1', 2, 3, 'baik',  'Rak A2', 'Panduan hidup Stoisisme yang diaplikasikan di era modern.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(4,  'Sapiens',                   'Yuval Noah Harari',     'KPG',               2017, '978-602-424-290-5', 2, 3, 'baik',  'Rak A2', 'Sejarah singkat umat manusia dari zaman batu hingga era modern.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(5,  'Matematika SMA Kelas X',    'Sukino',                'Erlangga',          2019, '978-602-298-990-0', 5, 8, 'baik',  'Rak C1', 'Buku teks matematika kurikulum 2013 revisi untuk kelas X.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(6,  'Pemrograman Python',        'Tim Komputer',          'Andi Publisher',    2021, '978-979-29-5678-1', 3, 6, 'baik',  'Rak B1', 'Panduan lengkap belajar Python dari dasar hingga mahir.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(7,  'Sejarah Indonesia Modern',  'M.C. Ricklefs',         'Serambi',           2008, '978-979-024-025-4', 4, 4, 'cukup', 'Rak B2', 'Sejarah Indonesia sejak abad XVIII hingga masa reformasi.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(8,  'Kimia Dasar',               'Raymond Chang',         'Erlangga',          2005, '978-979-781-718-5', 3, 2, 'cukup', 'Rak B1', 'Buku teks kimia dasar dua jilid untuk SMA dan perguruan tinggi.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(9,  'Kamus Besar Bahasa Indonesia','Tim Penyusun KBBI',   'Balai Pustaka',     2016, '978-979-407-182-1', 5, 3, 'baik',  'Rak C2', 'Kamus Besar Bahasa Indonesia edisi kelima.', 'cover.webp', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(10, 'Rich Dad Poor Dad',         'Robert T. Kiyosaki',   'Gramedia',          2000, '978-602-03-3492-5', 2, 0, 'buruk', 'Rak A2', 'Pelajaran keuangan dari ayah kaya dan ayah miskin.', 'cover.webp', '2026-01-08 09:00:00', '2026-03-01 10:00:00');

-- =============================================================
-- 6. Transaksi — riwayat peminjaman, status machine
-- =============================================================
-- Status: pending | approved | rejected | return_pending |
--         extension_pending | returned | overdue | lost

DROP TABLE IF EXISTS `Transaksi`;
CREATE TABLE `Transaksi` (
  `id`                  int          NOT NULL AUTO_INCREMENT,
  `user_id`             int          NOT NULL,
  `buku_id`             int          NOT NULL,
  `status`              enum('pending','approved','rejected','return_pending','extension_pending','returned','overdue','lost') NOT NULL,
  `tanggal_pinjam`      datetime     DEFAULT NULL,
  `tanggal_jatuh_tempo` datetime     DEFAULT NULL,
  `tanggal_kembali`     datetime     DEFAULT NULL,
  `kondisi_buku`        enum('baik','rusak_ringan','rusak_sedang','rusak_parah','hilang') DEFAULT NULL COMMENT 'Diisi saat pengembalian',
  `extension_count`     int          NOT NULL DEFAULT '0',
  `denda`               int          DEFAULT '0',
  `denda_dibayar`       int          NOT NULL DEFAULT '0',
  `rejection_reason`    text,
  `petugas_id`          int          DEFAULT NULL COMMENT 'Admin yang memproses transaksi ini',
  `created_at`          datetime     NOT NULL,
  `updated_at`          datetime     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transaksi_user_id`   (`user_id`),
  KEY `idx_transaksi_buku_id`   (`buku_id`),
  KEY `idx_transaksi_status`    (`status`),
  KEY `idx_transaksi_petugas_id`(`petugas_id`),
  CONSTRAINT `transaksi_ibfk_user`    FOREIGN KEY (`user_id`)    REFERENCES `Users`    (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transaksi_ibfk_buku`    FOREIGN KEY (`buku_id`)    REFERENCES `Buku`     (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transaksi_ibfk_petugas` FOREIGN KEY (`petugas_id`) REFERENCES `Users`    (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Transaksi` VALUES
-- 1: siswa1 meminjam Bumi Manusia → sudah dikembalikan (tepat waktu)
(1,  3, 1, 'returned',          '2026-01-15 09:00:00', '2026-01-22 09:00:00', '2026-01-21 14:00:00', 'baik',         0,     0,     0,    NULL,                      1, '2026-01-14 10:00:00', '2026-01-21 14:00:00'),
-- 2: siswa2 meminjam Laskar Pelangi → dikembalikan terlambat, rusak ringan, denda lunas
(2,  4, 2, 'returned',          '2026-01-20 09:00:00', '2026-01-27 09:00:00', '2026-02-05 11:00:00', 'rusak_ringan', 0,  14000,  14000,  NULL,                      1, '2026-01-19 10:00:00', '2026-02-05 11:00:00'),
-- 3: siswa3 meminjam Filosofi Teras → aktif dipinjam (approved), hampir jatuh tempo
(3,  5, 3, 'approved',          '2026-03-20 09:00:00', '2026-03-27 09:00:00', NULL,                  NULL,           0,     0,     0,    NULL,                      1, '2026-03-19 10:00:00', '2026-03-20 09:00:00'),
-- 4: siswa4 meminjam Sapiens → overdue (lewat jatuh tempo, belum kembali)
(4,  6, 4, 'overdue',           '2026-03-01 09:00:00', '2026-03-08 09:00:00', NULL,                  NULL,           0,  22000,     0,    NULL,                      1, '2026-02-28 10:00:00', '2026-03-09 09:00:00'),
-- 5: siswa1 meminjam Python → menunggu persetujuan admin (pending)
(5,  3, 6, 'pending',           NULL,                  NULL,                  NULL,                  NULL,           0,     0,     0,    NULL,                      NULL,'2026-03-30 08:00:00', '2026-03-30 08:00:00'),
-- 6: siswa5 meminjam Sejarah Indonesia → request pengembalian (return_pending)
(6,  7, 7, 'return_pending',    '2026-03-10 09:00:00', '2026-03-17 09:00:00', NULL,                  NULL,           0,  13000,     0,    NULL,                      1, '2026-03-09 10:00:00', '2026-03-30 07:00:00'),
-- 7: siswa2 meminjam Kimia Dasar → perpanjangan diajukan (extension_pending)
(7,  4, 8, 'extension_pending', '2026-03-15 09:00:00', '2026-03-22 09:00:00', NULL,                  NULL,           0,     0,     0,    NULL,                      1, '2026-03-14 10:00:00', '2026-03-29 15:00:00'),
-- 8: siswa3 meminjam Matematika SMA → ditolak (stok habis waktu itu / alasan admin)
(8,  5, 5, 'rejected',          NULL,                  NULL,                  NULL,                  NULL,           0,     0,     0,    'Buku sedang dalam proses perbaikan.', 1, '2026-02-10 09:00:00', '2026-02-10 10:00:00'),
-- 9: siswa4 meminjam Rich Dad Poor Dad → buku hilang, denda belum lunas
(9,  6,10, 'lost',              '2026-02-15 09:00:00', '2026-02-22 09:00:00', NULL,                  'hilang',       0,  50000,     0,    NULL,                      1, '2026-02-14 10:00:00', '2026-03-15 09:00:00'),
-- 10: siswa5 meminjam KBBI → dikembalikan, kondisi baik, perpanjangan 1x
(10, 7, 9, 'returned',          '2026-02-01 09:00:00', '2026-02-08 09:00:00', '2026-02-20 14:00:00', 'baik',         1,  12000,  12000,  NULL,                      2, '2026-01-31 10:00:00', '2026-02-20 14:00:00'),
-- 11: siswa6 (inactive) meminjam Bumi Manusia → dikembalikan sebelum dinonaktifkan
(11, 8, 1, 'returned',          '2026-01-25 09:00:00', '2026-02-01 09:00:00', '2026-01-30 11:00:00', 'baik',         0,     0,     0,    NULL,                      1, '2026-01-24 10:00:00', '2026-01-30 11:00:00');

-- =============================================================
-- 7. Notifikasi — riwayat notifikasi per user
-- =============================================================

DROP TABLE IF EXISTS `Notifikasi`;
CREATE TABLE `Notifikasi` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `user_id`      int          NOT NULL,
  `title`        varchar(255) NOT NULL,
  `message`      text         NOT NULL,
  `type`         varchar(255) NOT NULL COMMENT 'peminjaman_request | peminjaman_approved | peminjaman_rejected | pengembalian_request | pengembalian_approved | perpanjangan_request | perpanjangan_approved | overdue_reminder | denda_info',
  `transaksi_id` int          DEFAULT NULL,
  `is_read`      tinyint(1)   NOT NULL DEFAULT '0',
  `created_at`   datetime     NOT NULL,
  `updated_at`   datetime     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifikasi_user_id`      (`user_id`),
  KEY `idx_notifikasi_transaksi_id` (`transaksi_id`),
  KEY `idx_notifikasi_is_read`      (`is_read`),
  CONSTRAINT `notifikasi_ibfk_user`      FOREIGN KEY (`user_id`)      REFERENCES `Users`    (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifikasi_ibfk_transaksi` FOREIGN KEY (`transaksi_id`) REFERENCES `Transaksi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Notifikasi` VALUES
(1,  3, 'Peminjaman Disetujui',     'Peminjaman buku "Bumi Manusia" telah disetujui. Silakan ambil bukunya.',                                           'peminjaman_approved',   1,  1, '2026-01-15 09:05:00', '2026-01-15 09:05:00'),
(2,  3, 'Pengembalian Dikonfirmasi','Buku "Bumi Manusia" berhasil dikembalikan. Terima kasih!',                                                          'pengembalian_approved', 1,  1, '2026-01-21 14:05:00', '2026-01-21 14:05:00'),
(3,  4, 'Peminjaman Disetujui',     'Peminjaman buku "Laskar Pelangi" telah disetujui.',                                                                 'peminjaman_approved',   2,  1, '2026-01-20 09:05:00', '2026-01-20 09:05:00'),
(4,  4, 'Pengembalian & Denda',     'Buku "Laskar Pelangi" dikembalikan terlambat & rusak ringan. Denda: Rp 14.000 — Lunas.',                            'denda_info',            2,  1, '2026-02-05 11:05:00', '2026-02-05 11:05:00'),
(5,  5, 'Peminjaman Disetujui',     'Peminjaman buku "Filosofi Teras" telah disetujui.',                                                                 'peminjaman_approved',   3,  1, '2026-03-20 09:05:00', '2026-03-20 09:05:00'),
(6,  6, 'Pengingat Jatuh Tempo',    'Buku "Sapiens" akan jatuh tempo pada 2026-03-08. Segera kembalikan.',                                               'overdue_reminder',      4,  0, '2026-03-06 07:00:00', '2026-03-06 07:00:00'),
(7,  6, 'Buku Terlambat Dikembalikan','Buku "Sapiens" melewati tanggal jatuh tempo. Denda berjalan: Rp 1.000/hari.',                                     'overdue_reminder',      4,  0, '2026-03-09 07:00:00', '2026-03-09 07:00:00'),
(8,  5, 'Permintaan Ditolak',       'Maaf, permintaan peminjaman "Matematika SMA Kelas X" ditolak. Alasan: Buku sedang dalam proses perbaikan.',         'peminjaman_rejected',   8,  1, '2026-02-10 10:05:00', '2026-02-10 10:05:00'),
(9,  6, 'Buku Dinyatakan Hilang',   'Buku "Rich Dad Poor Dad" dinyatakan hilang. Denda: Rp 50.000.',                                                     'denda_info',            9,  0, '2026-03-15 09:05:00', '2026-03-15 09:05:00'),
(10, 7, 'Perpanjangan Disetujui',   'Perpanjangan peminjaman "Kamus Besar Bahasa Indonesia" disetujui. Tenggat baru: 2026-02-15.',                        'perpanjangan_approved', 10, 1, '2026-02-09 09:00:00', '2026-02-09 09:00:00'),
(11, 7, 'Pengembalian Dikonfirmasi','Buku "Kamus Besar Bahasa Indonesia" berhasil dikembalikan. Denda keterlambatan: Rp 12.000 — Lunas.',                'pengembalian_approved', 10, 1, '2026-02-20 14:05:00', '2026-02-20 14:05:00'),
(12, 3, 'Permintaan Peminjaman',    'Permintaan peminjaman buku "Pemrograman Python" sedang menunggu persetujuan admin.',                                'peminjaman_request',    5,  0, '2026-03-30 08:00:00', '2026-03-30 08:00:00');

-- =============================================================
-- Restore session variables
-- =============================================================
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump selesai: 2026-03-30
