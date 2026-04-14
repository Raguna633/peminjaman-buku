import cron from 'node-cron';
import db from '../models/index.js';
import { getCachedSettings } from '../utils/settingsCache.js';
import { getIO } from '../socket/index.js';

const { Notifikasi, Transaksi, Buku, User, Sequelize } = db;
const { Op } = Sequelize;

function dateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateYMD(date) {
  const d = dateOnly(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function startDailyCleanupJob() {
  cron.schedule('0 2 * * *', async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Notifikasi.destroy({
      where: {
        is_read: true,
        created_at: { [Op.lt]: thirtyDaysAgo },
      },
    });

    await Transaksi.update(
      { status: 'overdue' },
      {
        where: {
          status: 'approved',
          tanggal_jatuh_tempo: { [Op.lt]: new Date() },
          tanggal_kembali: { [Op.is]: null },
        },
      }
    );

    const settings = getCachedSettings();
    if (!settings) return;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + settings.reminder_days_before_due);
    const reminderDateYMD = formatDateYMD(reminderDate);

    const upcomingDue = await Transaksi.findAll({
      where: {
        status: 'approved',
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('tanggal_jatuh_tempo')),
            reminderDateYMD
          ),
        ],
      },
      include: [
        { model: User, as: 'user' },
        { model: Buku, as: 'buku' },
      ],
    });

    const io = getIO();

    for (const transaksi of upcomingDue) {
      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Pengingat Jatuh Tempo',
        message: `Buku '${transaksi.buku?.judul}' akan jatuh tempo dalam ${settings.reminder_days_before_due} hari`,
        type: 'warning',
        transaksi_id: transaksi.id,
        is_read: false,
      });

      io.to(`user:${transaksi.user_id}`).emit('notification', {
        title: 'Pengingat Jatuh Tempo',
        message: `Buku akan jatuh tempo dalam ${settings.reminder_days_before_due} hari`,
        type: 'warning',
      });
    }
  });
}
