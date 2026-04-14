/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // kategori_id merujuk ke urutan insert di seed-kategori:
  // 1 = Fiksi, 2 = Non-Fiksi, 3 = Sains, 4 = Teknologi, 5 = Sejarah

  // Reset agar Buku ID mulai dari 1
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.bulkDelete('Buku', null, {});
  await queryInterface.sequelize.query('ALTER TABLE Buku AUTO_INCREMENT = 1');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  await queryInterface.bulkInsert('Buku', [
    // ── Fiksi ────────────────────────────────────
    {
      // id: 1
      judul: 'Laskar Pelangi',
      pengarang: 'Andrea Hirata',
      penerbit: 'Bentang Pustaka',
      tahun_terbit: 2005,
      isbn: '978-979-1227-59-1',
      kategori_id: 1,
      stok: 5,
      kondisi: 'baik',
      lokasi: 'Rak A1',
      deskripsi:
        'Novel inspiratif tentang perjuangan anak-anak Belitung dalam mengejar pendidikan.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 2
      judul: 'Bumi Manusia',
      pengarang: 'Pramoedya Ananta Toer',
      penerbit: 'Hasta Mitra',
      tahun_terbit: 1980,
      isbn: '978-979-9731-28-0',
      kategori_id: 1,
      stok: 3,
      kondisi: 'baik',
      lokasi: 'Rak A1',
      deskripsi:
        'Novel pertama dari Tetralogi Buru yang berlatar era kolonial Hindia Belanda.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 3  — stok 0 untuk testing blokir peminjaman
      judul: 'Perahu Kertas',
      pengarang: 'Dewi Lestari',
      penerbit: 'Bentang Pustaka',
      tahun_terbit: 2009,
      isbn: '978-602-8811-07-8',
      kategori_id: 1,
      stok: 0,
      kondisi: 'baik',
      lokasi: 'Rak A2',
      deskripsi:
        'Kisah cinta dan mimpi dua anak muda yang saling melengkapi.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // ── Non-Fiksi ────────────────────────────────
    {
      // id: 4
      judul: 'Sapiens: Riwayat Singkat Umat Manusia',
      pengarang: 'Yuval Noah Harari',
      penerbit: 'Kepustakaan Populer Gramedia',
      tahun_terbit: 2017,
      isbn: '978-602-424-192-5',
      kategori_id: 2,
      stok: 4,
      kondisi: 'baik',
      lokasi: 'Rak B1',
      deskripsi:
        'Perjalanan evolusi manusia dari zaman prasejarah hingga modern.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 5
      judul: 'Filosofi Teras',
      pengarang: 'Henry Manampiring',
      penerbit: 'Kompas',
      tahun_terbit: 2018,
      isbn: '978-602-412-498-3',
      kategori_id: 2,
      stok: 6,
      kondisi: 'baik',
      lokasi: 'Rak B1',
      deskripsi:
        'Pengantar filsafat Stoa yang diaplikasikan dalam kehidupan sehari-hari.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // ── Sains ────────────────────────────────────
    {
      // id: 6
      judul: 'A Brief History of Time',
      pengarang: 'Stephen Hawking',
      penerbit: 'Gramedia Pustaka Utama',
      tahun_terbit: 2017,
      isbn: '978-602-03-3516-7',
      kategori_id: 3,
      stok: 2,
      kondisi: 'baik',
      lokasi: 'Rak C1',
      deskripsi:
        'Eksplorasi populer tentang kosmologi, lubang hitam, dan asal-usul alam semesta.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 7
      judul: 'Matematika untuk Semua',
      pengarang: 'Prof. Yohanes Surya',
      penerbit: 'Bhuana Ilmu Populer',
      tahun_terbit: 2015,
      isbn: '978-602-394-012-3',
      kategori_id: 3,
      stok: 3,
      kondisi: 'rusak_ringan',
      lokasi: 'Rak C2',
      deskripsi:
        'Buku matematika yang menjelaskan konsep-konsep dengan cara menyenangkan.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // ── Teknologi ────────────────────────────────
    {
      // id: 8
      judul: 'Clean Code',
      pengarang: 'Robert C. Martin',
      penerbit: 'Prentice Hall',
      tahun_terbit: 2008,
      isbn: '978-0-13-235088-4',
      kategori_id: 4,
      stok: 4,
      kondisi: 'baik',
      lokasi: 'Rak D1',
      deskripsi:
        'Panduan menulis kode yang bersih, mudah dibaca, dan mudah dipelihara.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 9
      judul: 'The Pragmatic Programmer',
      pengarang: 'David Thomas & Andrew Hunt',
      penerbit: 'Addison-Wesley',
      tahun_terbit: 2019,
      isbn: '978-0-13-595705-9',
      kategori_id: 4,
      stok: 2,
      kondisi: 'baik',
      lokasi: 'Rak D1',
      deskripsi:
        'Buku klasik tentang praktik terbaik pengembangan perangkat lunak.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 10
      judul: 'Belajar JavaScript Modern',
      pengarang: 'Sandhika Galih',
      penerbit: 'Informatika',
      tahun_terbit: 2022,
      isbn: '978-623-311-045-8',
      kategori_id: 4,
      stok: 5,
      kondisi: 'baik',
      lokasi: 'Rak D2',
      deskripsi:
        'Panduan lengkap belajar JavaScript dari dasar hingga lanjutan.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // ── Sejarah ──────────────────────────────────
    {
      // id: 11
      judul: 'Sejarah Indonesia Modern',
      pengarang: 'M.C. Ricklefs',
      penerbit: 'Gadjah Mada University Press',
      tahun_terbit: 2008,
      isbn: '978-979-420-720-0',
      kategori_id: 5,
      stok: 3,
      kondisi: 'baik',
      lokasi: 'Rak E1',
      deskripsi:
        'Analisis komprehensif sejarah Indonesia dari abad ke-13 hingga era reformasi.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 12
      judul: 'Nusantara: Sejarah Indonesia',
      pengarang: 'Bernard H.M. Vlekke',
      penerbit: 'Kepustakaan Populer Gramedia',
      tahun_terbit: 2016,
      isbn: '978-602-424-085-0',
      kategori_id: 5,
      stok: 1,
      kondisi: 'rusak_ringan',
      lokasi: 'Rak E1',
      deskripsi:
        'Perspektif sejarah Nusantara dari masa pra-kolonial hingga kemerdekaan.',
      sampul: 'cover.webp',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Buku', null, {});
}
