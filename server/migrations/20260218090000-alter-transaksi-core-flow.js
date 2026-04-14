/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

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

  await queryInterface.changeColumn('Transaksi', 'tanggal_pinjam', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.changeColumn('Transaksi', 'tanggal_jatuh_tempo', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.addColumn('Transaksi', 'denda_dibayar', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn('Transaksi', 'petugas_pinjam_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('Transaksi', 'petugas_kembali_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('Transaksi', ['status'], {
    name: 'idx_transaksi_status',
  });
}

export async function down(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.removeIndex('Transaksi', 'idx_transaksi_status');
  await queryInterface.removeColumn('Transaksi', 'petugas_kembali_id');
  await queryInterface.removeColumn('Transaksi', 'petugas_pinjam_id');
  await queryInterface.removeColumn('Transaksi', 'denda_dibayar');

  await queryInterface.changeColumn('Transaksi', 'tanggal_pinjam', {
    type: DataTypes.DATE,
    allowNull: false,
  });

  await queryInterface.changeColumn('Transaksi', 'tanggal_jatuh_tempo', {
    type: DataTypes.DATE,
    allowNull: false,
  });

  await queryInterface.changeColumn('Transaksi', 'status', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}
