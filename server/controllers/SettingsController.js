import SettingsService from '../services/SettingsService.js';

/**
 * Controller untuk mengelola pengaturan aplikasi perpustakaan.
 */
class SettingsController {
  /**
   * Mengambil semua pengaturan aplikasi yang aktif.
   * @param {import('express').Request} _req - Express Request object (tidak digunakan)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getSettings(_req, res) {
    try {
      const settings = await SettingsService.getSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (err) {
      console.error('Error fetching settings:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil settings' });
    }
  }

  /**
   * Memperbarui pengaturan aplikasi.
   * @param {import('express').Request} req - Express Request object (body: data settings baru)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async updateSettings(req, res) {
    try {
      const updated = await SettingsService.updateSettings(req.body || {});
      return res.status(200).json({
        success: true,
        message: 'Settings updated',
        data: updated,
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal memperbarui settings' });
    }
  }
}

export default SettingsController;
