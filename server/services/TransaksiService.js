import db from '../models/index.js';
import { getCachedSettings } from '../utils/settingsCache.js';
import AppError from '../utils/AppError.js';

const { Transaksi, Buku, Notifikasi, Sequelize, User } = db;
const { Op } = Sequelize;

// ── Helper functions ──────────────────────────────────────────

const VALID_KONDISI_BUKU = new Set([
  'baik', 'rusak_ringan', 'rusak_sedang', 'rusak_parah', 'hilang',
]);

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateOnly(input) {
  const d = new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDateYMD(date) {
  const d = toDateOnly(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateFine(tanggalJatuhTempo, tanggalKembali, settings) {
  if (!tanggalJatuhTempo || !tanggalKembali) return 0;
  const dueDate = toDateOnly(tanggalJatuhTempo);
  const returnDate = toDateOnly(tanggalKembali);
  if (returnDate <= dueDate) return 0;
  if (settings.denda_type === 'flat') return settings.denda_flat_amount || 0;

  const excluded = new Set(settings.excluded_denda_dates || []);
  let count = 0;
  let effectiveDueDate = new Date(dueDate);
  while (excluded.has(formatDateYMD(effectiveDueDate))) {
    effectiveDueDate.setDate(effectiveDueDate.getDate() + 1);
  }
  const iter = new Date(effectiveDueDate);
  iter.setDate(iter.getDate() + 1);
  while (iter <= returnDate) {
    if (!excluded.has(formatDateYMD(iter))) count += 1;
    iter.setDate(iter.getDate() + 1);
  }
  return count * (settings.denda_per_day_amount || 0);
}

export function calculateLateDays(tanggalJatuhTempo, tanggalKembali, excludedDatesArray) {
  if (!tanggalJatuhTempo || !tanggalKembali) return 0;
  const dueDate = toDateOnly(tanggalJatuhTempo);
  const returnDate = toDateOnly(tanggalKembali);
  if (returnDate <= dueDate) return 0;

  const excluded = new Set(excludedDatesArray || []);
  let count = 0;
  let effectiveDueDate = new Date(dueDate);
  while (excluded.has(formatDateYMD(effectiveDueDate))) {
    effectiveDueDate.setDate(effectiveDueDate.getDate() + 1);
  }
  const iter = new Date(effectiveDueDate);
  iter.setDate(iter.getDate() + 1);
  while (iter <= returnDate) {
    if (!excluded.has(formatDateYMD(iter))) count += 1;
    iter.setDate(iter.getDate() + 1);
  }
  return count;
}

export function calculateDamageFine(kondisiBuku, settings) {
  switch (kondisiBuku) {
    case 'rusak_ringan': return settings.denda_kerusakan_ringan || 0;
    case 'rusak_sedang': return settings.denda_kerusakan_sedang || 0;
    case 'rusak_parah': return settings.denda_kerusakan_parah || 0;
    case 'hilang': return settings.denda_hilang || 0;
    default: return 0;
  }
}

function pickSettingNumber(settings, ...keys) {
  for (const key of keys) {
    const value = settings?.[key];
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

async function hasAdminPresence() {
  const count = await User.count({
    where: { role: 'admin', is_on_duty: true, status: 'active' },
  });
  return count > 0;
}

// ── Service ───────────────────────────────────────────────────

class TransaksiService {

  static async getAll({ status, user_id, limit, offset, search } = {}) {
    const where = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (search) {
      where[Op.or] = [
        { '$buku.judul$': { [Op.like]: `%${search}%` } },
        { '$user.nama_lengkap$': { [Op.like]: `%${search}%` } },
        { '$user.nis$': { [Op.like]: `%${search}%` } },
      ];
    }
    const queryOptions = {
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'username', 'nama_lengkap', 'nis', 'foto'] },
        { model: Buku, as: 'buku' },
        { model: db.User, as: 'petugas', attributes: ['id', 'username', 'nama_lengkap'] },
      ],
      order: [['created_at', 'DESC']],
    };
    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);
    const result = await Transaksi.findAndCountAll(queryOptions);
    return { data: result.rows, totalItems: result.count };
  }

  static async getById(id, userId, role) {
    const transaksi = await Transaksi.findByPk(id, {
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'username', 'nama_lengkap', 'nis', 'foto'] },
        { model: Buku, as: 'buku' },
        { model: db.User, as: 'petugas', attributes: ['id', 'username', 'nama_lengkap'] },
      ],
    });
    if (!transaksi) throw new AppError('Transaksi tidak ditemukan', 404);
    if (role !== 'admin' && transaksi.user_id !== userId) {
      throw new AppError('Forbidden', 403);
    }
    return transaksi;
  }

  static async getByUser(userId, { status, limit, offset, search } = {}) {
    const where = { user_id: userId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where[Op.or] = [{ '$buku.judul$': { [Op.like]: `%${search}%` } }];
    }
    const queryOptions = {
      where,
      include: [{ model: Buku, as: 'buku' }],
      order: [['created_at', 'DESC']],
    };
    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);
    const result = await Transaksi.findAndCountAll(queryOptions);
    return { data: result.rows, totalItems: result.count };
  }

  // ── Peminjaman ─────────────────────────────────────────────

  static async requestPeminjaman(user, bukuId) {
    const adminOnDuty = await hasAdminPresence();
    if (!adminOnDuty) throw new AppError('Tidak ada admin berjaga saat ini. Silakan coba lagi nanti.', 400);

    const settings = getCachedSettings();
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const buku = await Buku.findByPk(bukuId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!buku) { await transaction.rollback(); throw new AppError('Buku tidak ditemukan', 404); }
      if (buku.stok <= 0) { await transaction.rollback(); throw new AppError('Stok buku habis', 400); }

      const existingBorrow = await Transaksi.findOne({
        where: {
          user_id: user.id, buku_id: bukuId,
          status: { [Op.in]: ['pending', 'approved', 'overdue', 'return_pending', 'extension_pending'] },
        },
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (existingBorrow) {
        await transaction.rollback();
        const msgs = {
          pending: 'Buku ini sudah dalam antrian peminjaman Anda dan sedang menunggu approval admin.',
          approved: 'Anda sedang meminjam buku ini. Kembalikan terlebih dahulu sebelum meminjam lagi.',
          overdue: 'Anda masih meminjam buku ini dan sudah melewati jatuh tempo. Segera kembalikan.',
          return_pending: 'Buku ini sedang dalam proses pengembalian. Tunggu sampai selesai.',
          extension_pending: 'Buku ini sedang dalam proses perpanjangan. Tunggu sampai selesai.',
        };
        throw new AppError(msgs[existingBorrow.status] || 'Anda sudah meminjam buku ini sebelumnya', 400);
      }

      const borrowCount = await Transaksi.count({
        where: { user_id: user.id, status: { [Op.in]: ['approved', 'overdue'] } }, transaction,
      });
      if (borrowCount >= settings.max_borrow_limit) {
        await transaction.rollback();
        throw new AppError(`Limit peminjaman tercapai. Maksimal ${settings.max_borrow_limit} buku per siswa.`, 400);
      }

      const unpaidFines = await Transaksi.findAll({
        where: {
          user_id: user.id,
          status: { [Op.in]: ['returned', 'overdue', 'lost'] },
          [Op.and]: [Sequelize.where(Sequelize.col('denda'), Op.gt, Sequelize.col('denda_dibayar'))],
        },
        transaction,
      });
      // if (unpaidFines.length > 0) {
      //   const totalUnpaid = unpaidFines.reduce((sum, t) => sum + (t.denda - t.denda_dibayar), 0);
      //   await transaction.rollback();
      //   throw new AppError(`Anda memiliki denda yang belum dibayar: Rp ${totalUnpaid.toLocaleString()}. Silakan lunasi terlebih dahulu.`, 400);
      // }

      const newTransaksi = await Transaksi.create({ user_id: user.id, buku_id: bukuId, status: 'pending' }, { transaction });

      await Notifikasi.create({
        user_id: user.id,
        title: 'Request Peminjaman Dikirim',
        message: `Menunggu approval admin untuk buku: ${buku.judul}`,
        type: 'info', transaksi_id: newTransaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();

      const detail = await Transaksi.findByPk(newTransaksi.id, { include: [{ model: Buku, as: 'buku' }] });
      return { transaksi: detail, buku, user };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) { /* already rolled back */ }
      throw err;
    }
  }

  static async approvePeminjaman(transaksiId, admin) {
    const settings = getCachedSettings();
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'pending') {
        await transaction.rollback();
        throw new AppError(`Transaksi sudah diproses (Status: ${transaksi.status})`, 400);
      }

      const buku = await Buku.findByPk(transaksi.buku_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!buku || buku.stok <= 0) {
        await transaction.rollback(); throw new AppError('Stok buku tidak tersedia saat ini', 400);
      }

      const borrowCount = await Transaksi.count({
        where: { user_id: transaksi.user_id, status: { [Op.in]: ['approved', 'overdue'] } }, transaction,
      });
      if (borrowCount >= settings.max_borrow_limit) {
        await transaction.rollback(); throw new AppError('User sudah mencapai limit peminjaman', 400);
      }

      const tanggalPinjam = new Date();
      const tanggalJatuhTempo = addDays(tanggalPinjam, settings.borrow_duration_days);

      await Transaksi.update(
        { status: 'approved', tanggal_pinjam: tanggalPinjam, tanggal_jatuh_tempo: tanggalJatuhTempo, petugas_id: admin.id },
        { where: { id: transaksiId }, transaction }
      );
      await Buku.update({ stok: buku.stok - 1 }, { where: { id: buku.id }, transaction });

      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Peminjaman Disetujui ✅',
        message: `Peminjaman buku '${buku.judul}' telah disetujui. Jatuh tempo: ${tanggalJatuhTempo.toLocaleDateString('id-ID')}`,
        type: 'success', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, buku, tanggalPinjam, tanggalJatuhTempo };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async rejectPeminjaman(transaksiId, reason) {
    const finalReason = reason || 'Ditolak oleh admin tanpa alasan spesifik';
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'pending') {
        await transaction.rollback();
        throw new AppError(`Transaksi sudah diproses (Status: ${transaksi.status})`, 400);
      }

      await Transaksi.update(
        { status: 'rejected', rejection_reason: finalReason },
        { where: { id: transaksiId }, transaction }
      );

      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Peminjaman Ditolak ❌',
        message: `Peminjaman buku '${transaksi.buku?.judul}' ditolak. Alasan: ${finalReason}`,
        type: 'error', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, reason: finalReason };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async bulkApprovePeminjaman(transaksiIds, admin) {
    if (!Array.isArray(transaksiIds) || transaksiIds.length === 0) {
      throw new AppError('transaksi_ids harus berupa array dan tidak boleh kosong', 400);
    }
    if (transaksiIds.length > 50) {
      throw new AppError('Maksimal 50 transaksi per bulk approve', 400);
    }

    const settings = getCachedSettings();
    const results = { success: [], failed: [] };

    for (const id of transaksiIds) {
      const t = await db.sequelize.transaction();
      let transaksi;

      try {
        transaksi = await Transaksi.findByPk(id, {
          transaction: t, lock: t.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
        });
        if (!transaksi) { results.failed.push({ id, reason: 'Transaksi tidak ditemukan' }); await t.rollback(); continue; }
        if (transaksi.status !== 'pending') { results.failed.push({ id, reason: `Status sudah ${transaksi.status}` }); await t.rollback(); continue; }

        const buku = await Buku.findByPk(transaksi.buku_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!buku || buku.stok <= 0) { results.failed.push({ id, reason: `Stok buku '${buku?.judul}' habis` }); await t.rollback(); continue; }

        const borrowCount = await Transaksi.count({
          where: { user_id: transaksi.user_id, status: { [Op.in]: ['approved', 'overdue'] } }, transaction: t,
        });
        if (borrowCount >= settings.max_borrow_limit) { results.failed.push({ id, reason: 'Limit tercapai' }); await t.rollback(); continue; }

        const tanggalPinjam = new Date();
        const tanggalJatuhTempo = addDays(tanggalPinjam, settings.borrow_duration_days);

        await Transaksi.update(
          { status: 'approved', tanggal_pinjam: tanggalPinjam, tanggal_jatuh_tempo: tanggalJatuhTempo, petugas_id: admin.id },
          { where: { id }, transaction: t }
        );
        await Buku.update({ stok: buku.stok - 1 }, { where: { id: buku.id }, transaction: t });
        await Notifikasi.create({
          user_id: transaksi.user_id, title: 'Peminjaman Disetujui',
          message: `Peminjaman buku '${buku.judul}' telah disetujui`,
          type: 'success', transaksi_id: transaksi.id, is_read: false,
        }, { transaction: t });

        await t.commit();
        results.success.push(id);
      } catch (err) {
        try { await t.rollback(); } catch (_) {}
        results.failed.push({ id, reason: err.message });
      }
    }

    return results;
  }

  // ── Pengembalian ───────────────────────────────────────────

  static async requestPengembalian(user, transaksiId) {
    const adminOnDuty = await hasAdminPresence();
    if (!adminOnDuty) throw new AppError('Tidak ada admin berjaga saat ini. Silakan coba lagi nanti.', 400);

    const transaction = await db.sequelize.transaction();

    try {
      const transaksi = await Transaksi.findOne({
        where: { id: transaksiId, user_id: user.id },
        transaction, lock: transaction.LOCK.UPDATE,
        include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (!['approved', 'overdue'].includes(transaksi.status)) {
        await transaction.rollback();
        throw new AppError('Transaksi tidak dapat diajukan pengembalian', 400);
      }

      await Transaksi.update({ status: 'return_pending' }, { where: { id: transaksiId }, transaction });

      await Notifikasi.create({
        user_id: user.id,
        title: 'Request Pengembalian Dikirim',
        message: `Menunggu konfirmasi admin untuk pengembalian buku: ${transaksi.buku.judul}`,
        type: 'info', transaksi_id: transaksiId, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async calculateFinePreview(transaksiId, kondisiBuku, excludedDatesOverride) {
    if (!VALID_KONDISI_BUKU.has(kondisiBuku)) throw new AppError('Kondisi buku tidak valid', 400);

    const transaksi = await Transaksi.findByPk(transaksiId, {
      include: [{ model: Buku, as: 'buku' }, { model: User, as: 'user' }],
    });
    if (!transaksi) throw new AppError('Transaksi tidak ditemukan', 404);
    if (!['return_pending', 'lost'].includes(transaksi.status)) {
      throw new AppError(`Kalkulasi denda hanya bisa dilakukan untuk transaksi return_pending atau lost. Status saat ini: ${transaksi.status}`, 400);
    }

    const settings = getCachedSettings();
    const effectiveExcludedDates = Array.isArray(excludedDatesOverride) ? excludedDatesOverride : (settings.excluded_denda_dates || []);
    const settingsForCalc = {
      ...(typeof settings.get === 'function' ? settings.get({ plain: true }) : settings),
      excluded_denda_dates: effectiveExcludedDates,
    };

    const tanggalKembaliEstimasi = new Date();
    const dendaTerlambat = calculateFine(transaksi.tanggal_jatuh_tempo, tanggalKembaliEstimasi, settingsForCalc);
    const dendaKondisi = calculateDamageFine(kondisiBuku, settings);
    let totalDenda = dendaTerlambat + dendaKondisi;
    const maxDenda = pickSettingNumber(settings, 'max_denda_amount');
    if (maxDenda > 0 && totalDenda > maxDenda) totalDenda = maxDenda;

    const hariTerlambat = calculateLateDays(transaksi.tanggal_jatuh_tempo, tanggalKembaliEstimasi, effectiveExcludedDates);

    return {
      transaksi,
      kalkulasi: {
        transaksi_id: transaksi.id,
        kondisi_buku: kondisiBuku,
        tanggal_jatuh_tempo: transaksi.tanggal_jatuh_tempo,
        tanggal_kembali_estimasi: tanggalKembaliEstimasi,
        hari_terlambat: hariTerlambat,
        excluded_dates_digunakan: effectiveExcludedDates,
        rincian_denda: { denda_terlambat: dendaTerlambat, denda_kondisi: dendaKondisi, total_denda: totalDenda },
        buku: { judul: transaksi.buku?.judul, kondisi_saat_kembali: kondisiBuku },
      },
    };
  }

  static async approvePengembalian(transaksiId, admin, kondisiBuku, excludedDatesOverride) {
    if (!VALID_KONDISI_BUKU.has(kondisiBuku)) throw new AppError('Kondisi buku tidak valid', 400);

    const settings = getCachedSettings();
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (!['return_pending', 'lost'].includes(transaksi.status)) {
        await transaction.rollback();
        throw new AppError(`Transaksi tidak bisa di-approve (Status: ${transaksi.status})`, 400);
      }

      const buku = await Buku.findByPk(transaksi.buku_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!buku) { await transaction.rollback(); throw new AppError('Buku terkait transaksi ini tidak ditemukan', 404); }

      const effectiveExcludedDates = Array.isArray(excludedDatesOverride) ? excludedDatesOverride : (settings.excluded_denda_dates || []);
      const settingsForCalc = {
        ...(typeof settings.get === 'function' ? settings.get({ plain: true }) : settings),
        excluded_denda_dates: effectiveExcludedDates,
      };

      const tanggalKembali = new Date();
      const dendaKeterlambatan = calculateFine(transaksi.tanggal_jatuh_tempo, tanggalKembali, settingsForCalc);
      const dendaKerusakan = calculateDamageFine(kondisiBuku, settings);
      let dendaTotal = dendaKeterlambatan + dendaKerusakan;
      const maxDenda = pickSettingNumber(settings, 'max_denda_amount');
      if (maxDenda > 0 && dendaTotal > maxDenda) dendaTotal = maxDenda;
      const statusPengembalian = kondisiBuku === 'hilang' ? 'lost' : 'returned';

      await Transaksi.update(
        { status: statusPengembalian, tanggal_kembali: tanggalKembali, denda: dendaTotal, kondisi_buku: kondisiBuku, petugas_id: admin.id },
        { where: { id: transaksiId }, transaction }
      );
      if (kondisiBuku !== 'hilang') {
        await Buku.update({ stok: buku.stok + 1 }, { where: { id: buku.id }, transaction });
      }

      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Pengembalian Disetujui ✅',
        message: dendaTotal > 0
          ? `Pengembalian buku '${transaksi.buku?.judul}' disetujui. Denda: Rp ${dendaTotal.toLocaleString()}`
          : `Pengembalian buku '${transaksi.buku?.judul}' disetujui tanpa denda`,
        type: dendaTotal > 0 ? 'warning' : 'success',
        transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, statusPengembalian, dendaTotal, dendaKeterlambatan, dendaKerusakan, kondisiBuku };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async rejectPengembalian(transaksiId, reason) {
    const finalReason = reason || 'Pengembalian ditolak oleh admin';
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'return_pending') {
        await transaction.rollback();
        throw new AppError(`Transaksi tidak bisa ditolak (Status: ${transaksi.status})`, 400);
      }

      const previousStatus = new Date() > transaksi.tanggal_jatuh_tempo ? 'overdue' : 'approved';
      await Transaksi.update(
        { status: previousStatus, rejection_reason: finalReason },
        { where: { id: transaksiId }, transaction }
      );

      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Pengembalian Ditolak ❌',
        message: `Pengembalian buku '${transaksi.buku?.judul}' ditolak. Alasan: ${finalReason}`,
        type: 'error', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, previousStatus, reason: finalReason };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  // ── Payment ────────────────────────────────────────────────

  static async processPayment(transaksiId, jumlahBayar) {
    if (jumlahBayar < 0) throw new AppError('Jumlah bayar tidak valid', 400);

    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (!['returned', 'lost'].includes(transaksi.status)) {
        await transaction.rollback();
        throw new AppError('Pembayaran denda hanya bisa dilakukan setelah pengembalian buku dikonfirmasi oleh admin.', 400);
      }

      const dendaDibayarCurrent = Number(transaksi.denda_dibayar) || 0;
      const dendaTotal = Number(transaksi.denda) || 0;
      const sisaDenda = Math.max(0, dendaTotal - dendaDibayarCurrent);
      if (sisaDenda <= 0) {
        await transaction.rollback();
        throw new AppError('Tidak ada denda yang perlu dibayar untuk transaksi ini.', 400);
      }

      const bayarSekarang = Math.min(jumlahBayar, sisaDenda);
      const kembalian = jumlahBayar > sisaDenda ? jumlahBayar - sisaDenda : 0;
      const sisaSetelahBayar = sisaDenda - bayarSekarang;
      const isLunas = sisaSetelahBayar <= 0;

      await Transaksi.update({ denda_dibayar: dendaDibayarCurrent + bayarSekarang }, { where: { id: transaksiId }, transaction });

      let notifTitle, notifMessage, notifType;
      if (isLunas) {
        notifTitle = 'Denda Lunas ✅';
        notifMessage = `Pembayaran denda untuk buku '${transaksi.buku?.judul}' sebesar Rp ${bayarSekarang.toLocaleString()} telah diterima. Denda lunas!`;
        notifType = 'success';
      } else if (jumlahBayar === 0) {
        notifTitle = 'Harap Bayar Dendanya Nanti Ya!';
        notifMessage = `Denda untuk buku '${transaksi.buku?.judul}' sebesar Rp ${sisaDenda.toLocaleString()} belum dibayar. Silakan lunasi kepada petugas.`;
        notifType = 'warning';
      } else {
        notifTitle = 'Harap Bayar Sisa Dendanya Nanti Ya!';
        notifMessage = `Pembayaran denda untuk buku '${transaksi.buku?.judul}' diterima Rp ${bayarSekarang.toLocaleString()}. Sisa denda: Rp ${sisaSetelahBayar.toLocaleString()}. Silakan lunasi kepada petugas.`;
        notifType = 'warning';
      }

      await Notifikasi.create({
        user_id: transaksi.user_id, title: notifTitle, message: notifMessage,
        type: notifType, transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();

      return {
        transaksi,
        transaksi_id: transaksi.id, total_denda: dendaTotal,
        bayar_sekarang: bayarSekarang, kembalian, sisa_denda: sisaSetelahBayar, is_lunas: isLunas,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async bulkProcessPayment(transaksiIds, jumlahBayar, userId) {
    if (jumlahBayar < 0 || !transaksiIds || transaksiIds.length === 0 || transaksiIds.length > 20) {
      throw new AppError('Input tidak valid (Maksimal 20 transaksi)', 400);
    }

    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksiList = await Transaksi.findAll({
        where: {
          id: { [Op.in]: transaksiIds }, user_id: userId,
          status: { [Op.in]: ['returned', 'lost'] },
          [Op.and]: [Sequelize.where(Sequelize.col('denda'), Op.gt, Sequelize.col('denda_dibayar'))],
        },
        order: [['created_at', 'ASC']],
        include: [{ model: Buku, as: 'buku' }],
        transaction, lock: transaction.LOCK.UPDATE,
      });

      if (transaksiList.length !== transaksiIds.length) {
        await transaction.rollback();
        throw new AppError('Beberapa transaksi tidak ditemukan atau tidak memiliki denda yang perlu dibayar.', 400);
      }

      const totalSisaDenda = transaksiList.reduce((sum, t) => sum + (Number(t.denda) - Number(t.denda_dibayar || 0)), 0);
      const kembalian = jumlahBayar > totalSisaDenda ? jumlahBayar - totalSisaDenda : 0;
      const sisaSetelahBayar = jumlahBayar >= totalSisaDenda ? 0 : totalSisaDenda - jumlahBayar;
      const isLunas = sisaSetelahBayar <= 0;

      let sisaUang = jumlahBayar;
      const paymentRecords = [];
      for (const t of transaksiList) {
        const dendaDibayarCurrent = Number(t.denda_dibayar || 0);
        const sisaTransaksi = Number(t.denda) - dendaDibayarCurrent;
        if (sisaUang <= 0) { paymentRecords.push({ transaksi_id: t.id, buku: t.buku?.judul, bayar: 0, sisa: sisaTransaksi }); continue; }
        const bayarUntukIni = Math.min(sisaUang, sisaTransaksi);
        sisaUang -= bayarUntukIni;
        await Transaksi.update({ denda_dibayar: dendaDibayarCurrent + bayarUntukIni }, { where: { id: t.id }, transaction });
        paymentRecords.push({ transaksi_id: t.id, buku: t.buku?.judul, bayar: bayarUntukIni, sisa: sisaTransaksi - bayarUntukIni });
      }

      await Notifikasi.create({
        user_id: userId,
        title: isLunas ? 'Semua Denda Lunas ✅' : 'Sebagian Denda Dibayar',
        message: `Pembayaran denda untuk ${transaksiIds.length} transaksi diproses.${sisaSetelahBayar > 0 ? ` Sisa total: Rp ${sisaSetelahBayar.toLocaleString()}` : ''}`,
        type: isLunas ? 'success' : 'warning', is_read: false,
      }, { transaction });

      await transaction.commit();

      return {
        userId,
        total_sisa_denda: totalSisaDenda, total_bayar: jumlahBayar,
        kembalian, sisa_setelah_bayar: sisaSetelahBayar, is_lunas: isLunas, payment_records: paymentRecords,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  // ── Perpanjangan ───────────────────────────────────────────

  static async requestPerpanjangan(user, transaksiId) {
    const adminOnDuty = await hasAdminPresence();
    if (!adminOnDuty) throw new AppError('Tidak ada admin berjaga saat ini. Silakan coba lagi nanti.', 400);

    const settings = getCachedSettings();
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findOne({
        where: { id: transaksiId, user_id: user.id },
        transaction, lock: transaction.LOCK.UPDATE,
        include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'approved') {
        await transaction.rollback();
        throw new AppError('Perpanjangan hanya bisa dilakukan untuk buku yang sedang dipinjam dan belum melewati jatuh tempo.', 400);
      }
      if (transaksi.tanggal_jatuh_tempo && new Date() > transaksi.tanggal_jatuh_tempo) {
        await transaction.rollback();
        throw new AppError('Perpanjangan hanya bisa dilakukan sebelum jatuh tempo.', 400);
      }
      if (settings && settings.allow_extension === false) {
        await transaction.rollback();
        throw new AppError('Fitur perpanjangan sedang tidak tersedia.', 400);
      }
      const maxExtensions = Number.isFinite(settings?.max_extensions) ? settings.max_extensions : 0;
      if (transaksi.extension_count >= maxExtensions) {
        await transaction.rollback();
        throw new AppError(`Batas maksimal perpanjangan telah tercapai. Maksimal ${maxExtensions}x perpanjangan.`, 400);
      }

      const unpaidFines = await Transaksi.findAll({
        where: {
          user_id: user.id,
          status: { [Op.in]: ['returned', 'overdue', 'lost'] },
          [Op.and]: [Sequelize.where(Sequelize.col('denda'), Op.gt, Sequelize.col('denda_dibayar'))],
        },
        transaction,
      });
      if (unpaidFines.length > 0) {
        const totalUnpaid = unpaidFines.reduce((sum, t) => sum + (t.denda - t.denda_dibayar), 0);
        await transaction.rollback();
        throw new AppError(`Anda memiliki denda yang belum dibayar: Rp ${totalUnpaid.toLocaleString()}. Silakan lunasi terlebih dahulu.`, 400);
      }

      await Transaksi.update({ status: 'extension_pending' }, { where: { id: transaksiId }, transaction });
      await Notifikasi.create({
        user_id: user.id,
        title: 'Request Perpanjangan Dikirim',
        message: `Menunggu approval admin untuk perpanjangan buku: ${transaksi.buku?.judul}`,
        type: 'info', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();

      const detail = await Transaksi.findByPk(transaksi.id, { include: [{ model: Buku, as: 'buku' }] });
      return { transaksi: detail, settings };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async approvePerpanjangan(transaksiId, admin) {
    const settings = getCachedSettings();
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'extension_pending') {
        await transaction.rollback();
        throw new AppError('Transaksi tidak dalam status menunggu perpanjangan', 400);
      }
      const maxExtensions = Number.isFinite(settings?.max_extensions) ? settings.max_extensions : 0;
      if (transaksi.extension_count >= maxExtensions) {
        await transaction.rollback();
        throw new AppError('Batas maksimal perpanjangan telah tercapai', 400);
      }
      if (!transaksi.tanggal_jatuh_tempo) {
        await transaction.rollback();
        throw new AppError('Tanggal jatuh tempo tidak ditemukan', 400);
      }

      const tanggalJatuhTempoLama = transaksi.tanggal_jatuh_tempo;
      const tanggalJatuhTempoBaru = addDays(tanggalJatuhTempoLama, settings.borrow_duration_days);
      const newExtensionCount = transaksi.extension_count + 1;

      await Transaksi.update(
        { status: 'approved', tanggal_jatuh_tempo: tanggalJatuhTempoBaru, extension_count: newExtensionCount, petugas_id: admin.id },
        { where: { id: transaksiId }, transaction }
      );
      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Perpanjangan Disetujui ✅',
        message: `Perpanjangan buku '${transaksi.buku?.judul}' disetujui. Jatuh tempo baru: ${tanggalJatuhTempoBaru.toLocaleDateString('id-ID')}`,
        type: 'success', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, tanggalJatuhTempoLama, tanggalJatuhTempoBaru, newExtensionCount, settings };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  static async rejectPerpanjangan(transaksiId, reason) {
    const finalReason = reason || 'Ditolak oleh admin tanpa alasan spesifik';
    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, {
        transaction, lock: transaction.LOCK.UPDATE, include: [{ model: Buku, as: 'buku' }],
      });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'extension_pending') {
        await transaction.rollback();
        throw new AppError('Transaksi tidak dalam status menunggu perpanjangan', 400);
      }

      const previousStatus = new Date() > transaksi.tanggal_jatuh_tempo ? 'overdue' : 'approved';
      await Transaksi.update(
        { status: previousStatus, rejection_reason: finalReason },
        { where: { id: transaksiId }, transaction }
      );
      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Perpanjangan Ditolak ❌',
        message: `Perpanjangan buku '${transaksi.buku?.judul}' ditolak. Alasan: ${finalReason}`,
        type: 'error', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, previousStatus, reason: finalReason };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }

  // ── Return Lost ────────────────────────────────────────────

  static async returnLost(transaksiId, admin, kondisiBuku) {
    if (!kondisiBuku) throw new AppError('kondisi_buku wajib diisi', 400);
    if (!VALID_KONDISI_BUKU.has(kondisiBuku) || kondisiBuku === 'hilang') {
      throw new AppError('Kondisi buku tidak valid untuk pengembalian buku hilang', 400);
    }

    const transaction = await db.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const transaksi = await Transaksi.findByPk(transaksiId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!transaksi) { await transaction.rollback(); throw new AppError('Transaksi tidak ditemukan', 404); }
      if (transaksi.status !== 'lost') {
        await transaction.rollback();
        throw new AppError(`Transaksi tidak bisa dikembalikan dari status hilang (Status: ${transaksi.status})`, 400);
      }

      const buku = await Buku.findByPk(transaksi.buku_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!buku) { await transaction.rollback(); throw new AppError('Buku tidak ditemukan', 404); }

      await Transaksi.update(
        { status: 'returned', tanggal_kembali: new Date(), kondisi_buku: kondisiBuku, petugas_id: admin.id },
        { where: { id: transaksiId }, transaction }
      );
      await Buku.update({ stok: buku.stok + 1 }, { where: { id: buku.id }, transaction });

      await Notifikasi.create({
        user_id: transaksi.user_id,
        title: 'Buku Hilang Ditemukan',
        message: `Buku '${buku.judul}' telah ditemukan dan dikembalikan.`,
        type: 'success', transaksi_id: transaksi.id, is_read: false,
      }, { transaction });

      await transaction.commit();
      return { transaksi, kondisiBuku };
    } catch (err) {
      if (err instanceof AppError) throw err;
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }
  }
}

export default TransaksiService;
