/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  const userTable = await queryInterface.describeTable('Users');
  if (!userTable.status) {
    await queryInterface.addColumn('Users', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
    });
  }

  const transaksiTable = await queryInterface.describeTable('Transaksi');
  if (!transaksiTable.kondisi_buku) {
    await queryInterface.addColumn('Transaksi', 'kondisi_buku', {
      type: DataTypes.ENUM(
        'baik',
        'rusak_ringan',
        'rusak_sedang',
        'rusak_parah',
        'hilang'
      ),
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const transaksiTable = await queryInterface.describeTable('Transaksi');
  if (transaksiTable.kondisi_buku) {
    await queryInterface.removeColumn('Transaksi', 'kondisi_buku');
  }
  const userTable = await queryInterface.describeTable('Users');
  if (userTable.status) {
    await queryInterface.removeColumn('Users', 'status');
  }
}
