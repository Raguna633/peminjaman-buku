import { refreshSettings, getCachedSettings, loadSettings } from '../utils/settingsCache.js';
import db from '../models/index.js';
import AppError from '../utils/AppError.js';

const { Settings } = db;

class SettingsService {
  static async getSettings() {
    return getCachedSettings() || (await loadSettings());
  }

  static async updateSettings(payload) {
    await Settings.update(payload, { where: { id: 1 } });
    return refreshSettings();
  }
}

export default SettingsService;
