import { refreshSettings, getCachedSettings, loadSettings } from '../utils/settingsCache.js';
import db from '../models/index.js';
import AppError from '../utils/AppError.js';

const { Settings } = db;

/**
 * Service untuk mengelola pengaturan sistem (Denda, Limit Pinjam, dll).
 */
class SettingsService {
  /**
   * Mengambil seluruh pengaturan sistem dari cache atau database.
   * @returns {Promise<Object>} Objek pengaturan sistem.
   */
  static async getSettings() {
    return getCachedSettings() || (await loadSettings());
  }

  /**
   * Memperbarui pengaturan sistem dan menyegarkan cache.
   * @param {Object} payload - Data pengaturan yang akan diubah.
   * @returns {Promise<Object>} Pengaturan terbaru setelah di-refresh.
   */
  static async updateSettings(payload) {
    await Settings.update(payload, { where: { id: 1 } });
    return refreshSettings();
  }
}

export default SettingsService;
