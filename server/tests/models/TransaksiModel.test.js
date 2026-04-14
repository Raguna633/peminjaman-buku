import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute, initModels } from './modelTestUtils.js';
import TransaksiModel from '../../models/TransaksiModel.js';

describe('TransaksiModel', () => {
  it('defines expected attributes', () => {
    const sequelize = createSequelize();
    const Transaksi = TransaksiModel(sequelize, Sequelize.DataTypes);

    const status = getAttribute(Transaksi, 'status');
    expect(status).toBeTruthy();
    const enumValues = status.type?.values || status.values || status.type?.options?.values;
    expect(enumValues).toEqual([
      'pending',
      'approved',
      'rejected',
      'return_pending',
      'extension_pending',
      'returned',
      'overdue',
      'lost',
    ]);

    expect(getAttribute(Transaksi, 'tanggal_pinjam').allowNull).toBe(true);
    expect(getAttribute(Transaksi, 'tanggal_jatuh_tempo').allowNull).toBe(true);
    expect(getAttribute(Transaksi, 'denda').defaultValue).toBe(0);
    expect(getAttribute(Transaksi, 'denda_dibayar').defaultValue).toBe(0);
    expect(getAttribute(Transaksi, 'petugas_id').allowNull).toBe(true);
    const kondisiBuku = getAttribute(Transaksi, 'kondisi_buku');
    expect(kondisiBuku).toBeTruthy();
    const kondisiValues = kondisiBuku.type?.values || kondisiBuku.values || kondisiBuku.type?.options?.values;
    expect(kondisiValues).toEqual([
      'baik',
      'rusak_ringan',
      'rusak_sedang',
      'rusak_parah',
      'hilang',
    ]);
    expect(kondisiBuku.allowNull).toBe(true);
  });

  it('defines expected associations', () => {
    const { models } = initModels();

    expect(models.Transaksi.associations.user).toBeTruthy();
    expect(models.Transaksi.associations.buku).toBeTruthy();
    expect(models.Transaksi.associations.notifikasi).toBeTruthy();
    expect(models.Transaksi.associations.petugas).toBeTruthy();
  });
});
