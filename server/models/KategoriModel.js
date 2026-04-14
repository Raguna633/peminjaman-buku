import { Model } from 'sequelize';

const KategoriModel = (sequelize, DataTypes) => {
  class Kategori extends Model {
    static associate(models) {
      Kategori.hasMany(models.Buku, {
        foreignKey: 'kategori_id',
        as: 'buku',
      });
    }
  }

  Kategori.init(
    {
      nama: DataTypes.STRING,
      deskripsi: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Kategori',
      tableName: 'Kategori',
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  return Kategori;
};

export default KategoriModel;
