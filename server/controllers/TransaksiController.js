import { validationResult } from 'express-validator';
import TransaksiService from '../services/TransaksiService.js';
import { getIO } from '../socket/index.js';
import { logError } from '../utils/logger.js';
import { pushNotificationToUser } from '../utils/notificationHelper.js';

/**
 * Controller untuk mengelola seluruh alur transaksi (Peminjaman, Pengembalian, Pembayaran, Perpanjangan).
 */
class TransaksiController {

  /**
   * Mengambil semua daftar transaksi dengan filter opsional.
   * @param {import('express').Request} req - Express Request object (query: status, user_id, limit, offset, search)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getAll(req, res) {
    try {
      const { status, user_id, limit, offset, search } = req.query;
      const result = await TransaksiService.getAll({ status, user_id, limit, offset, search });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logError('getAllTransaksi', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal mengambil data transaksi' });
    }
  }

  /**
   * Mengambil satu data transaksi berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const transaksi = await TransaksiService.getById(id, userId, role);
      return res.status(200).json({ success: true, data: transaksi });
    } catch (err) {
      logError('getTransaksiById', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal mengambil detail transaksi' });
    }
  }

  /**
   * Mengambil riwayat transaksi milik user yang sedang login.
   * @param {import('express').Request} req - Express Request object (query: status, limit, offset, search)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getByUser(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit, offset, search } = req.query;
      const result = await TransaksiService.getByUser(userId, { status, limit, offset, search });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logError('getTransaksiByUser', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal mengambil riwayat transaksi' });
    }
  }

  // ── Peminjaman ─────────────────────────────────────────────

  /**
   * Mengajukan permohonan peminjaman buku oleh user.
   * @param {import('express').Request} req - Express Request object (body: buku_id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async requestPeminjaman(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { buku_id } = req.body;
      const user = req.user;
      const { transaksi, buku } = await TransaksiService.requestPeminjaman(user, buku_id);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { peminjaman: pendingCount });
        io.to('admin').emit('peminjaman:request', {
          transaksiId: transaksi.id,
          siswa: { id: user.id, nama: user.nama_lengkap, nis: user.nis, foto: user.foto },
          buku: { id: buku.id, judul: buku.judul, sampul: buku.sampul },
          timestamp: new Date().toISOString(),
        });
      } catch (socketErr) {
        logError('requestPeminjaman:socket', socketErr);
      }

      return res.status(201).json({ success: true, message: 'Request peminjaman berhasil dikirim. Mohon tunggu approval admin.', data: transaksi });
    } catch (err) {
      logError('requestPeminjaman', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal membuat request peminjaman' });
    }
  }

  /**
   * Menyetujui permohonan peminjaman buku oleh admin.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async approvePeminjaman(req, res) {
    try {
      const { id } = req.params;
      const admin = req.user;
      const { transaksi, buku, tanggalPinjam, tanggalJatuhTempo } = await TransaksiService.approvePeminjaman(id, admin);

      try {
        const io = getIO();
        io.to(`user:${transaksi.user_id}`).emit('peminjaman:approved', {
          transaksiId: transaksi.id,
          status: 'approved',
          data: {
            buku: { id: buku.id, judul: buku.judul },
            tanggal_pinjam: tanggalPinjam,
            tanggal_jatuh_tempo: tanggalJatuhTempo,
            petugas: admin.nama_lengkap || admin.username,
          },
        });
        const pendingCount = await TransaksiService.getAll({ status: 'pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { peminjaman: pendingCount });
        await pushNotificationToUser(io, transaksi.user_id, transaksi.id);
      } catch (socketErr) {
        logError('approvePeminjaman:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Peminjaman berhasil disetujui', data: transaksi });
    } catch (err) {
      logError('approvePeminjaman', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menyetujui peminjaman' });
    }
  }

  /**
   * Menolak permohonan peminjaman buku oleh admin.
   * @param {import('express').Request} req - Express Request object (params: id, body: rejection_reason)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async rejectPeminjaman(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const { transaksi, reason } = await TransaksiService.rejectPeminjaman(id, rejection_reason);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { peminjaman: pendingCount });
        io.to(`user:${transaksi.user_id}`).emit('peminjaman:rejected', {
          transaksiId: transaksi.id,
          status: 'rejected',
          reason,
          buku: transaksi.buku?.judul,
        });
        await pushNotificationToUser(io, transaksi.user_id, transaksi.id);
      } catch (socketErr) {
        logError('rejectPeminjaman:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Peminjaman ditolak' });
    } catch (err) {
      logError('rejectPeminjaman', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menolak peminjaman' });
    }
  }

  /**
   * Menyetujui banyak permohonan peminjaman sekaligus.
   * @param {import('express').Request} req - Express Request object (body: transaksi_ids[])
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async bulkApprovePeminjaman(req, res) {
    try {
      const { transaksi_ids } = req.body;
      const admin = req.user;
      const results = await TransaksiService.bulkApprovePeminjaman(transaksi_ids, admin);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { peminjaman: pendingCount });
      } catch (socketErr) {
        logError('bulkApprove:socket', socketErr);
      }

      return res.status(200).json({
        success: true,
        message: `Proses bulk approve selesai. Berhasil: ${results.success.length}, Gagal: ${results.failed.length}`,
        data: results
      });
    } catch (err) {
      logError('bulkApprove', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal memproses bulk approve' });
    }
  }

  // ── Pengembalian ───────────────────────────────────────────

  /**
   * Mengajukan permohonan pengembalian buku oleh user.
   * @param {import('express').Request} req - Express Request object (body: transaksi_id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async requestPengembalian(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const id = req.body.transaksi_id;
      const user = req.user;
      const { transaksi } = await TransaksiService.requestPengembalian(user, id);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'return_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { pengembalian: pendingCount });
        io.to('admin').emit('pengembalian:request', {
          transaksiId: transaksi.id,
          siswa: { id: user.id, nama: user.nama_lengkap, nis: user.nis, foto: user.foto },
          buku: { id: transaksi.buku?.id, judul: transaksi.buku?.judul, sampul: transaksi.buku?.sampul },
          timestamp: new Date().toISOString(),
        });
      } catch (socketErr) {
        logError('requestPengembalian:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Request pengembalian berhasil dikirim. Silakan serahkan buku ke petugas.', data: transaksi });
    } catch (err) {
      logError('requestPengembalian', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal memproses request pengembalian' });
    }
  }

  /**
   * Menghitung preview denda sebelum pengembalian disetujui.
   * @param {import('express').Request} req - Express Request object (params: id, body: kondisi_buku, excluded_dates)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async calculateFinePreview(req, res) {
    try {
      const { id } = req.params;
      const { kondisi_buku, excluded_dates } = req.body;
      const { kalkulasi } = await TransaksiService.calculateFinePreview(id, kondisi_buku, excluded_dates);

      try {
        const io = getIO();
        io.to(`user:${kalkulasi.transaksi_id}`).emit('pengembalian:fine_preview', kalkulasi);
      } catch (socketErr) {
        logError('finePreview:socket', socketErr);
      }

      return res.status(200).json({ success: true, data: kalkulasi });
    } catch (err) {
      logError('calculateFinePreview', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menghitung denda' });
    }
  }

  /**
   * Menyetujui pengembalian buku dan mencatat denda jika ada.
   * @param {import('express').Request} req - Express Request object (params: id, body: kondisi_buku, excluded_dates)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async approvePengembalian(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { kondisi_buku, excluded_dates } = req.body;
      const admin = req.user;
      const result = await TransaksiService.approvePengembalian(id, admin, kondisi_buku, excluded_dates);

      try {
        const io = getIO();
        io.to(`user:${result.transaksi.user_id}`).emit('pengembalian:approved', {
          transaksiId: result.transaksi.id,
          status: result.statusPengembalian,
          data: {
            buku: { id: result.transaksi.buku?.id, judul: result.transaksi.buku?.judul },
            kondisi_buku: result.kondisiBuku,
            denda_total: result.dendaTotal,
            denda_keterlambatan: result.dendaKeterlambatan,
            denda_kerusakan: result.dendaKerusakan,
            petugas: admin.nama_lengkap || admin.username,
          },
        });
        const pendingCount = await TransaksiService.getAll({ status: 'return_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { pengembalian: pendingCount });
        await pushNotificationToUser(io, result.transaksi.user_id, result.transaksi.id);
      } catch (socketErr) {
        logError('approvePengembalian:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Pengembalian berhasil disetujui', data: result.transaksi });
    } catch (err) {
      logError('approvePengembalian', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menyetujui pengembalian' });
    }
  }

  /**
   * Menolak permohonan pengembalian buku (misal: buku fisik belum diserahkan).
   * @param {import('express').Request} req - Express Request object (params: id, body: rejection_reason)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async rejectPengembalian(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const { transaksi, previousStatus, reason } = await TransaksiService.rejectPengembalian(id, rejection_reason);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'return_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { pengembalian: pendingCount });
        io.to(`user:${transaksi.user_id}`).emit('pengembalian:rejected', {
          transaksiId: transaksi.id,
          status: previousStatus,
          reason,
          buku: transaksi.buku?.judul,
        });
        await pushNotificationToUser(io, transaksi.user_id, transaksi.id);
      } catch (socketErr) {
        logError('rejectPengembalian:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Pengembalian ditolak' });
    } catch (err) {
      logError('rejectPengembalian', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menolak pengembalian' });
    }
  }

  // ── Payment ────────────────────────────────────────────────

  /**
   * Memproses pembayaran denda untuk satu transaksi.
   * @param {import('express').Request} req - Express Request object (params: id, body: jumlah_bayar)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async processPayment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { jumlah_bayar } = req.body;
      const result = await TransaksiService.processPayment(id, jumlah_bayar);

      try {
        const io = getIO();
        const pesanSiswa = result.is_lunas
          ? 'Pembayaran Denda Selesai!'
          : (jumlah_bayar === 0 ? 'Harap Bayar Dendanya Nanti Ya!' : 'Harap Bayar Sisa Dendanya Nanti Ya!');

        io.to(`user:${result.transaksi.user_id}`).emit('denda:payment_result', {
          transaksi_id: result.transaksi.id,
          is_lunas: result.is_lunas,
          bayar_sekarang: result.bayar_sekarang,
          kembalian: result.kembalian,
          sisa_denda: result.sisa_denda,
          pesan: pesanSiswa
        });
      } catch (socketErr) {
        logError('processPayment:socket', socketErr);
      }

      const pesanAdmin = result.is_lunas ? 'Pembayaran Denda Selesai!' : 'Pembayaran Denda Disimpan!';
      return res.status(200).json({ success: true, message: pesanAdmin, data: result });
    } catch (err) {
      logError('processPayment', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal memproses pembayaran denda' });
    }
  }

  /**
   * Memproses pembayaran denda untuk beberapa transaksi sekaligus (Siswa yang sama).
   * @param {import('express').Request} req - Express Request object (body: transaksi_ids[], jumlah_bayar, user_id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async bulkProcessPayment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { transaksi_ids, jumlah_bayar, user_id } = req.body;
      const result = await TransaksiService.bulkProcessPayment(transaksi_ids, jumlah_bayar, user_id);

      try {
        const io = getIO();
        const pesanSiswa = result.is_lunas ? 'Pembayaran Denda Selesai!' : 'Harap Bayar Sisa Dendanya Nanti Ya!';
        io.to(`user:${user_id}`).emit('denda:payment_result', {
          is_bulk: true,
          is_lunas: result.is_lunas,
          total_bayar: jumlah_bayar,
          total_denda: result.total_sisa_denda,
          kembalian: result.kembalian,
          sisa_denda: result.sisa_setelah_bayar,
          payment_records: result.payment_records,
          pesan: pesanSiswa
        });
      } catch (socketErr) {
        logError('bulkProcessPayment:socket', socketErr);
      }

      const pesanAdmin = result.is_lunas ? 'Pembayaran Denda Selesai!' : 'Pembayaran Denda Disimpan!';
      return res.status(200).json({ success: true, message: pesanAdmin, data: result });
    } catch (err) {
      logError('bulkProcessPayment', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal memproses pembayaran denda bulk' });
    }
  }

  // ── Perpanjangan ───────────────────────────────────────────

  /**
   * Mengajukan perpanjangan masa pinjam buku oleh user.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async requestPerpanjangan(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const { transaksi, settings } = await TransaksiService.requestPerpanjangan(user, id);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'extension_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { perpanjangan: pendingCount });
        io.to('admin').emit('perpanjangan:request', {
          transaksiId: transaksi.id,
          siswa: { id: user.id, nama: user.nama_lengkap, nis: user.nis, foto: user.foto },
          buku: { id: transaksi.buku?.id, judul: transaksi.buku?.judul, sampul: transaksi.buku?.sampul },
          tanggal_jatuh_tempo_lama: transaksi.tanggal_jatuh_tempo,
          extension_ke: transaksi.extension_count + 1,
          max_extensions: settings?.max_extensions || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (socketErr) {
        logError('requestPerpanjangan:socket', socketErr);
      }

      return res.status(201).json({ success: true, message: 'Request perpanjangan berhasil dikirim. Mohon tunggu approval admin.', data: transaksi });
    } catch (err) {
      logError('requestPerpanjangan', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal membuat request perpanjangan' });
    }
  }

  /**
   * Menyetujui perpanjangan masa pinjam oleh admin.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async approvePerpanjangan(req, res) {
    try {
      const { id } = req.params;
      const admin = req.user;
      const { transaksi, tanggalJatuhTempoLama, tanggalJatuhTempoBaru, newExtensionCount, settings } = await TransaksiService.approvePerpanjangan(id, admin);

      try {
        const io = getIO();
        io.to(`user:${transaksi.user_id}`).emit('perpanjangan:approved', {
          transaksiId: transaksi.id,
          status: 'approved',
          data: {
            buku: { id: transaksi.buku?.id, judul: transaksi.buku?.judul },
            tanggal_jatuh_tempo_lama: tanggalJatuhTempoLama,
            tanggal_jatuh_tempo_baru: tanggalJatuhTempoBaru,
            extension_count: newExtensionCount,
            max_extensions: settings?.max_extensions || 0,
            petugas: admin.nama_lengkap || admin.username,
          },
        });
        const pendingCount = await TransaksiService.getAll({ status: 'extension_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { perpanjangan: pendingCount });
        await pushNotificationToUser(io, transaksi.user_id, transaksi.id);
      } catch (socketErr) {
        logError('approvePerpanjangan:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Perpanjangan berhasil disetujui', data: { tanggal_jatuh_tempo_baru: tanggalJatuhTempoBaru, extension_count: newExtensionCount } });
    } catch (err) {
      logError('approvePerpanjangan', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menyetujui perpanjangan' });
    }
  }

  /**
   * Menolak permohonan perpanjangan masa pinjam oleh admin.
   * @param {import('express').Request} req - Express Request object (params: id, body: rejection_reason)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async rejectPerpanjangan(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const { transaksi, previousStatus, reason } = await TransaksiService.rejectPerpanjangan(id, rejection_reason);

      try {
        const io = getIO();
        const pendingCount = await TransaksiService.getAll({ status: 'extension_pending' }).then(r => r.totalItems);
        io.to('admin').emit('pending:count:update', { perpanjangan: pendingCount });
        io.to(`user:${transaksi.user_id}`).emit('perpanjangan:rejected', {
          transaksiId: transaksi.id,
          status: previousStatus,
          reason,
          buku: transaksi.buku?.judul,
          tanggal_jatuh_tempo: transaksi.tanggal_jatuh_tempo,
        });
        await pushNotificationToUser(io, transaksi.user_id, transaksi.id);
      } catch (socketErr) {
        logError('rejectPerpanjangan:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Perpanjangan ditolak' });
    } catch (err) {
      logError('rejectPerpanjangan', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal menolak perpanjangan' });
    }
  }

  // ── Return Lost ────────────────────────────────────────────

  /**
   * Mengatur status pengembalian untuk buku yang sebelumnya dilaporkan hilang.
   * @param {import('express').Request} req - Express Request object (params: id, body: kondisi_buku)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async returnLost(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { kondisi_buku } = req.body;
      const admin = req.user;
      const { transaksi, kondisiBuku } = await TransaksiService.returnLost(id, admin, kondisi_buku);

      try {
        const io = getIO();
        io.to(`user:${transaksi.user_id}`).emit('pengembalian:approved', {
          transaksiId: transaksi.id,
          status: 'returned',
          kondisi_buku: kondisiBuku,
          from_lost: true,
        });
      } catch (socketErr) {
        logError('returnLost:socket', socketErr);
      }

      return res.status(200).json({ success: true, message: 'Buku hilang berhasil dikembalikan' });
    } catch (err) {
      logError('returnLost', err);
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Gagal mengembalikan buku hilang' });
    }
  }
}

export default TransaksiController;
