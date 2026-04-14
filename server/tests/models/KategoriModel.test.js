import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute, initModels } from './modelTestUtils.js';
import KategoriModel from '../../models/KategoriModel.js';

describe('KategoriModel', () => {
  it('defines expected attributes', () => {
    const sequelize = createSequelize();
    const Kategori = KategoriModel(sequelize, Sequelize.DataTypes);

    expect(getAttribute(Kategori, 'nama')).toBeTruthy();
    expect(getAttribute(Kategori, 'deskripsi')).toBeTruthy();
    expect(Kategori.options.underscored).toBe(true);
    expect(Kategori.options.timestamps).toBe(true);
  });

  it('defines expected associations', () => {
    const { models } = initModels();

    expect(models.Kategori.associations.buku).toBeTruthy();
  });
});
