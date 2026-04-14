/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.createTable('Notifikasi', {
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
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transaksi_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Transaksi',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

  await queryInterface.addIndex('Notifikasi', ['user_id'], {
    name: 'idx_notifikasi_user_id',
  });
  await queryInterface.addIndex('Notifikasi', ['transaksi_id'], {
    name: 'idx_notifikasi_transaksi_id',
  });
  await queryInterface.addIndex('Notifikasi', ['is_read'], {
    name: 'idx_notifikasi_is_read',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Notifikasi', 'idx_notifikasi_is_read');
  await queryInterface.removeIndex('Notifikasi', 'idx_notifikasi_transaksi_id');
  await queryInterface.removeIndex('Notifikasi', 'idx_notifikasi_user_id');
  await queryInterface.dropTable('Notifikasi');
}
