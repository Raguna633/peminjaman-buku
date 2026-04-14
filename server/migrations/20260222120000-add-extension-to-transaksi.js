/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.changeColumn('Transaksi', 'status', {
    type: DataTypes.ENUM(
      'pending',
      'approved',
      'rejected',
      'return_pending',
      'extension_pending',
      'returned',
      'overdue',
      'lost'
    ),
    allowNull: false,
  });

  await queryInterface.addColumn('Transaksi', 'extension_count', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.removeColumn('Transaksi', 'extension_count');

  await queryInterface.changeColumn('Transaksi', 'status', {
    type: DataTypes.ENUM(
      'pending',
      'approved',
      'rejected',
      'return_pending',
      'returned',
      'overdue',
      'lost'
    ),
    allowNull: false,
  });
}
