import db from '../models/index.js';

const { Notifikasi } = db;

class NotifikasiService {
  static async getUnread(userId) {
    const notifications = await Notifikasi.findAll({
      where: { user_id: userId, is_read: false },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    return { data: notifications, count: notifications.length };
  }

  static async markRead(notificationId, userId) {
    await Notifikasi.update(
      { is_read: true },
      { where: { id: notificationId, user_id: userId } }
    );
  }

  static async markAllRead(userId) {
    await Notifikasi.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  }
}

export default NotifikasiService;
