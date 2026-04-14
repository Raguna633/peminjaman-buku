import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute, initModels } from './modelTestUtils.js';
import NotifikasiModel from '../../models/NotifikasiModel.js';

describe('NotifikasiModel', () => {
  it('defines expected attributes', () => {
    const sequelize = createSequelize();
    const Notifikasi = NotifikasiModel(sequelize, Sequelize.DataTypes);

    expect(getAttribute(Notifikasi, 'title')).toBeTruthy();
    expect(getAttribute(Notifikasi, 'message')).toBeTruthy();
    expect(getAttribute(Notifikasi, 'type')).toBeTruthy();
    expect(getAttribute(Notifikasi, 'is_read').defaultValue).toBe(false);
    expect(Notifikasi.options.underscored).toBe(true);
    expect(Notifikasi.options.timestamps).toBe(true);
  });

  it('defines expected associations', () => {
    const { models } = initModels();

    expect(models.Notifikasi.associations.user).toBeTruthy();
    expect(models.Notifikasi.associations.transaksi).toBeTruthy();
  });
});
