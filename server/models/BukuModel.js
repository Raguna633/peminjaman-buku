import { Model } from 'sequelize';

const BukuModel = (sequelize, DataTypes) => {
  class Buku extends Model {
    static associate(models) {
      Buku.belongsTo(models.Kategori, {
        foreignKey: 'kategori_id',
        as: 'kategori',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      Buku.hasMany(models.Transaksi, {
        foreignKey: 'buku_id',
        as: 'transaksi',
      });
    }
  }

  Buku.init(
    {
      judul: DataTypes.STRING,
      pengarang: DataTypes.STRING,
      penerbit: DataTypes.STRING,
      tahun_terbit: DataTypes.INTEGER,
      isbn: DataTypes.STRING,
      kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Kategori',
          key: 'id',
        },
      },
      stok: DataTypes.INTEGER,
      kondisi: DataTypes.STRING,
      lokasi: DataTypes.STRING,
      deskripsi: DataTypes.TEXT,
      sampul: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Buku',
      tableName: 'Buku',
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  return Buku;
};

export default BukuModel;
