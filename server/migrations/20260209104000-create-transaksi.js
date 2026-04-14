/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.createTable('Transaksi', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    buku_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Buku',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggal_pinjam: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tanggal_jatuh_tempo: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tanggal_kembali: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    denda: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });

  await queryInterface.addIndex('Transaksi', ['user_id'], {
    name: 'idx_transaksi_user_id',
  });
  await queryInterface.addIndex('Transaksi', ['buku_id'], {
    name: 'idx_transaksi_buku_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Transaksi', 'idx_transaksi_buku_id');
  await queryInterface.removeIndex('Transaksi', 'idx_transaksi_user_id');
  await queryInterface.dropTable('Transaksi');
}
