import db from '../models/index.js';

const { Settings } = db;

let cachedSettings = null;

export async function loadSettings() {
  let settings = await Settings.findByPk(1);
  if (!settings) {
    await Settings.create({
      id: 1,
      max_borrow_limit: 3,
      borrow_duration_days: 7,
      allow_extension: true,
      max_extensions: 1,
      max_denda_amount: 50000,
      denda_type: 'per_day',
      denda_per_day_amount: 1000,
      denda_flat_amount: 5000,
      denda_kerusakan_ringan: 5000,
      denda_kerusakan_sedang: 10000,
      denda_kerusakan_parah: 15000,
      denda_hilang: 50000,
      excluded_denda_dates: [],
      reminder_days_before_due: 2,
      kelas_list: ['X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A', 'XII-B'],
    });
    settings = await Settings.findByPk(1);
  }

  cachedSettings = settings;
  return cachedSettings;
}

export function getCachedSettings() {
  return cachedSettings;
}

export async function refreshSettings() {
  cachedSettings = await Settings.findByPk(1);
  return cachedSettings;
}
