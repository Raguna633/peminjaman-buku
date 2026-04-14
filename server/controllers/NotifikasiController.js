import NotifikasiService from '../services/NotifikasiService.js';

/**
 * Controller untuk mengelola notifikasi pengguna.
 */
class NotifikasiController {
  /**
   * Mengambil semua notifikasi yang belum dibaca untuk pengguna yang sedang login.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getUnread(req, res) {
    try {
      const result = await NotifikasiService.getUnread(req.user.id);
      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil notifikasi' });
    }
  }

  /**
   * Menandai satu notifikasi sebagai sudah dibaca.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async markRead(req, res) {
    try {
      await NotifikasiService.markRead(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      console.error('Error marking notification:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menandai notifikasi' });
    }
  }

  /**
   * Menandai semua notifikasi pengguna sebagai sudah dibaca.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async markAllRead(req, res) {
    try {
      await NotifikasiService.markAllRead(req.user.id);
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking all notifications:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menandai semua notifikasi' });
    }
  }
}

export default NotifikasiController;
