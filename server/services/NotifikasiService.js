import db from '../models/index.js';

const { Notifikasi } = db;

/**
 * Service untuk mengelola data notifikasi user.
 */
class NotifikasiService {
  /**
   * Mengambil semua notifikasi yang belum dibaca milik user.
   * @param {number} userId - ID User.
   * @returns {Promise<Object>} Berisi array data notifikasi dan jumlahnya.
   */
  static async getUnread(userId) {
    const notifications = await Notifikasi.findAll({
      where: { user_id: userId, is_read: false },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    return { data: notifications, count: notifications.length };
  }

  /**
   * Menandai satu notifikasi tertentu sebagai sudah dibaca.
   * @param {number} notificationId - ID Notifikasi.
   * @param {number} userId - ID User (pemilik notifikasi).
   */
  static async markRead(notificationId, userId) {
    await Notifikasi.update(
      { is_read: true },
      { where: { id: notificationId, user_id: userId } }
    );
  }

  /**
   * Menandai seluruh notifikasi user sebagai sudah dibaca.
   * @param {number} userId - ID User.
   */
  static async markAllRead(userId) {
    await Notifikasi.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  }
}

export default NotifikasiService;
