/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addConstraint('Buku', {
    fields: ['kategori_id'],
    type: 'foreign key',
    name: 'fk_buku_kategori_id',
    references: {
      table: 'Kategori',
      field: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('Buku', ['kategori_id'], {
    name: 'idx_buku_kategori_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Buku', 'idx_buku_kategori_id');
  await queryInterface.removeConstraint('Buku', 'fk_buku_kategori_id');
}
