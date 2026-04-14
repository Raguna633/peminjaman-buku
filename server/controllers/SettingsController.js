import SettingsService from '../services/SettingsService.js';

class SettingsController {
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
