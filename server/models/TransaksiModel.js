import { Model } from 'sequelize';

const TransaksiModel = (sequelize, DataTypes) => {
  class Transaksi extends Model {
    static associate(models) {
      Transaksi.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
      Transaksi.belongsTo(models.User, {
        foreignKey: 'petugas_id',
        as: 'petugas',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      Transaksi.belongsTo(models.Buku, {
        foreignKey: 'buku_id',
        as: 'buku',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
      Transaksi.hasMany(models.Notifikasi, {
        foreignKey: 'transaksi_id',
        as: 'notifikasi',
      });
    }
  }

  Transaksi.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      buku_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Buku',
          key: 'id',
        },
      },
      status: {
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
      },
      tanggal_pinjam: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      tanggal_jatuh_tempo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      tanggal_kembali: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      kondisi_buku: {
        type: DataTypes.ENUM(
          'baik',
          'rusak_ringan',
          'rusak_sedang',
          'rusak_parah',
          'hilang'
        ),
        allowNull: true,
      },
      extension_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      denda: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      denda_dibayar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      petugas_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Transaksi',
      tableName: 'Transaksi',
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  return Transaksi;
};

export default TransaksiModel;
