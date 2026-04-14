import { Model } from 'sequelize';

const UserModel = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Transaksi, {
        foreignKey: 'user_id',
        as: 'transaksi',
      });
      User.hasMany(models.Transaksi, {
        foreignKey: 'petugas_id',
        as: 'transaksi_diproses',
      });
      User.hasMany(models.Notifikasi, {
        foreignKey: 'user_id',
        as: 'notifikasi',
      });
    }
  }
  User.init({
    username: DataTypes.STRING,
    nama_lengkap: DataTypes.STRING,
    class: DataTypes.STRING,
    nis: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
    password: DataTypes.STRING,
    foto: DataTypes.STRING,
    is_on_duty: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'User',
    underscored: true,
    timestamps: true,
  });
  return User;
};

export default UserModel;
