import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { createSequelize, getAttribute } from './modelTestUtils.js';
import SettingsModel from '../../models/SettingsModel.js';

describe('SettingsModel', () => {
  it('defines expected attributes with defaults', () => {
    const sequelize = createSequelize();
    const Settings = SettingsModel(sequelize, Sequelize.DataTypes);

    expect(getAttribute(Settings, 'max_borrow_limit').defaultValue).toBe(3);
    expect(getAttribute(Settings, 'borrow_duration_days').defaultValue).toBe(7);
    expect(getAttribute(Settings, 'allow_extension').defaultValue).toBe(true);
    expect(getAttribute(Settings, 'max_extensions').defaultValue).toBe(1);
    expect(getAttribute(Settings, 'max_denda_amount').defaultValue).toBe(50000);
    expect(getAttribute(Settings, 'denda_type').defaultValue).toBe('per_day');
    expect(getAttribute(Settings, 'denda_per_day_amount').defaultValue).toBe(1000);
    expect(getAttribute(Settings, 'denda_flat_amount').defaultValue).toBe(5000);
    expect(getAttribute(Settings, 'denda_kerusakan_ringan').defaultValue).toBe(5000);
    expect(getAttribute(Settings, 'denda_kerusakan_sedang').defaultValue).toBe(10000);
    expect(getAttribute(Settings, 'denda_kerusakan_parah').defaultValue).toBe(15000);
    expect(getAttribute(Settings, 'denda_hilang').defaultValue).toBe(50000);
    expect(getAttribute(Settings, 'excluded_denda_dates').defaultValue).toEqual([]);
    expect(getAttribute(Settings, 'reminder_days_before_due').defaultValue).toBe(2);
    expect(Settings.options.underscored).toBe(true);
    expect(Settings.options.timestamps).toBe(true);
  });
});
