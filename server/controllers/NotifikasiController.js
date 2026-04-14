import NotifikasiService from '../services/NotifikasiService.js';

class NotifikasiController {
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
