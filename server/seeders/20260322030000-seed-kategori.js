/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // Reset agar Kategori ID mulai dari 1
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.bulkDelete('Kategori', null, {});
  await queryInterface.sequelize.query('ALTER TABLE Kategori AUTO_INCREMENT = 1');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  await queryInterface.bulkInsert('Kategori', [
    {
      // id: 1
      nama: 'Fiksi',
      deskripsi: 'Novel, cerpen, dan karya sastra fiksi lainnya',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 2
      nama: 'Non-Fiksi',
      deskripsi: 'Buku pengetahuan umum, biografi, dan referensi',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 3
      nama: 'Sains',
      deskripsi: 'Buku tentang ilmu pengetahuan alam, matematika, dan fisika',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 4
      nama: 'Teknologi',
      deskripsi: 'Buku tentang komputer, pemrograman, dan teknologi informasi',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      // id: 5
      nama: 'Sejarah',
      deskripsi: 'Buku tentang sejarah Indonesia dan dunia',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Kategori', null, {});
}
