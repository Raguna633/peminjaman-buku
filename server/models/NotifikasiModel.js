import { Model } from 'sequelize';

const NotifikasiModel = (sequelize, DataTypes) => {
  class Notifikasi extends Model {
    static associate(models) {
      Notifikasi.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Notifikasi.belongsTo(models.Transaksi, {
        foreignKey: 'transaksi_id',
        as: 'transaksi',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  Notifikasi.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
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
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Notifikasi',
      tableName: 'Notifikasi',
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  return Notifikasi;
};

export default NotifikasiModel;
