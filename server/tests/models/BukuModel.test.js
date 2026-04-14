import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute, initModels } from './modelTestUtils.js';
import BukuModel from '../../models/BukuModel.js';

describe('BukuModel', () => {
  it('defines expected attributes', () => {
    const sequelize = createSequelize();
    const Buku = BukuModel(sequelize, Sequelize.DataTypes);

    expect(getAttribute(Buku, 'judul')).toBeTruthy();
    expect(getAttribute(Buku, 'pengarang')).toBeTruthy();
    expect(getAttribute(Buku, 'penerbit')).toBeTruthy();
    expect(getAttribute(Buku, 'tahun_terbit')).toBeTruthy();
    expect(getAttribute(Buku, 'isbn')).toBeTruthy();
    expect(getAttribute(Buku, 'kategori_id')).toBeTruthy();
    expect(getAttribute(Buku, 'stok')).toBeTruthy();
    expect(getAttribute(Buku, 'kondisi')).toBeTruthy();
    expect(getAttribute(Buku, 'lokasi')).toBeTruthy();
    expect(getAttribute(Buku, 'deskripsi')).toBeTruthy();
    expect(getAttribute(Buku, 'sampul')).toBeTruthy();
    expect(Buku.options.underscored).toBe(true);
    expect(Buku.options.timestamps).toBe(true);
  });

  it('defines expected associations', () => {
    const { models } = initModels();

    expect(models.Buku.associations.kategori).toBeTruthy();
    expect(models.Buku.associations.transaksi).toBeTruthy();
  });
});
