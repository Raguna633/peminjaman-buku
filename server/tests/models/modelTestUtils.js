import { Sequelize } from 'sequelize';
import Database from 'better-sqlite3';
import UserModel from '../../models/UserModel.js';
import BukuModel from '../../models/BukuModel.js';
import KategoriModel from '../../models/KategoriModel.js';
import TransaksiModel from '../../models/TransaksiModel.js';
import NotifikasiModel from '../../models/NotifikasiModel.js';
import SettingsModel from '../../models/SettingsModel.js';

export function createSequelize() {
  return new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    dialectModule: Database,
  });
}

export function getAttribute(model, name) {
  return model.getAttributes()[name];
}

export function initModels() {
  const sequelize = createSequelize();
  const User = UserModel(sequelize, Sequelize.DataTypes);
  const Buku = BukuModel(sequelize, Sequelize.DataTypes);
  const Kategori = KategoriModel(sequelize, Sequelize.DataTypes);
  const Transaksi = TransaksiModel(sequelize, Sequelize.DataTypes);
  const Notifikasi = NotifikasiModel(sequelize, Sequelize.DataTypes);
  const Settings = SettingsModel(sequelize, Sequelize.DataTypes);

  const models = { User, Buku, Kategori, Transaksi, Notifikasi, Settings };
  Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });

  return { sequelize, models };
}
