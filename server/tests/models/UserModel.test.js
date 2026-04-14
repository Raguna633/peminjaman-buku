import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute, initModels } from './modelTestUtils.js';
import UserModel from '../../models/UserModel.js';

describe('UserModel', () => {
  it('defines expected attributes', () => {
    const sequelize = createSequelize();
    const User = UserModel(sequelize, Sequelize.DataTypes);

    expect(getAttribute(User, 'username')).toBeTruthy();
    expect(getAttribute(User, 'nama_lengkap')).toBeTruthy();
    expect(getAttribute(User, 'class')).toBeTruthy();
    expect(getAttribute(User, 'nis')).toBeTruthy();
    expect(getAttribute(User, 'phone')).toBeTruthy();
    expect(getAttribute(User, 'email')).toBeTruthy();
    expect(getAttribute(User, 'role')).toBeTruthy();
    expect(getAttribute(User, 'status')).toBeTruthy();
    expect(getAttribute(User, 'password')).toBeTruthy();
    expect(getAttribute(User, 'foto')).toBeTruthy();
    expect(getAttribute(User, 'is_on_duty')).toBeTruthy();
    expect(getAttribute(User, 'is_on_duty').defaultValue).toBe(false);
    expect(User.options.underscored).toBe(true);
    expect(User.options.timestamps).toBe(true);
  });

  it('defines expected associations', () => {
    const { models } = initModels();

    expect(models.User.associations.transaksi).toBeTruthy();
    expect(models.User.associations.notifikasi).toBeTruthy();
    expect(models.User.associations.transaksi_diproses).toBeTruthy();
  });
});
