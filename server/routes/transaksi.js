import express from 'express';
import { body } from 'express-validator';
import TransaksiController from '../controllers/TransaksiController.js';
import auth, { requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET routes
/**
 * @swagger
 * tags:
 *   name: Transaksi
 *   description: API untuk peminjaman, pengembalian, dan perpanjangan buku
 */

/**
 * @swagger
 * /transaksi:
 *   get:
 *     summary: Ambil semua transaksi (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data transaksi
 */
router.get('/', auth, requireRole(['admin']), TransaksiController.getAll);

/**
 * @swagger
 * /transaksi/user:
 *   get:
 *     summary: Ambil riwayat transaksi user yang login
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memperoleh riwayat user
 */
router.get('/user', auth, TransaksiController.getByUser);

/**
 * @swagger
 * /transaksi/{id}:
 *   get:
 *     summary: Ambil detail transaksi berdasarkan ID
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail transaksi ditemukan
 */
router.get('/:id', auth, TransaksiController.getById);

/**
 * @swagger
 * /transaksi/request-peminjaman:
 *   post:
 *     summary: Request peminjaman buku (User only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buku_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Request berhasil dikirim
 */
router.post(
  '/request-peminjaman',
  auth,
  requireRole(['user']),
  body('buku_id').notEmpty().isInt(),
  TransaksiController.requestPeminjaman
);

/**
 * @swagger
 * /transaksi/{id}/approve-peminjaman:
 *   put:
 *     summary: Approve request peminjaman (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Peminjaman disetujui
 */
router.put(
  '/:id/approve-peminjaman',
  auth,
  requireRole(['admin']),
  TransaksiController.approvePeminjaman
);

/**
 * @swagger
 * /transaksi/{id}/reject-peminjaman:
 *   put:
 *     summary: Reject request peminjaman (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Peminjaman ditolak
 */
router.put(
  '/:id/reject-peminjaman',
  auth,
  requireRole(['admin']),
  TransaksiController.rejectPeminjaman
);

/**
 * @swagger
 * /transaksi/bulk-approve-peminjaman:
 *   post:
 *     summary: Bulk approve peminjaman (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil approve secara massal
 */
router.post(
  '/bulk-approve-peminjaman',
  auth,
  requireRole(['admin']),
  body('transaksi_ids').isArray(),
  TransaksiController.bulkApprovePeminjaman
);

/**
 * @swagger
 * /transaksi/request-pengembalian:
 *   post:
 *     summary: Request pengembalian buku (User only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Request pengembalian berhasil
 */
router.post(
  '/request-pengembalian',
  auth,
  requireRole(['user']),
  body('transaksi_id').notEmpty().isInt(),
  TransaksiController.requestPengembalian
);

/**
 * @swagger
 * /transaksi/{id}/approve-pengembalian:
 *   put:
 *     summary: Approve pengembalian (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pengembalian disetujui
 */
router.put(
  '/:id/approve-pengembalian',
  auth,
  requireRole(['admin']),
  body('kondisi_buku').notEmpty().isIn([
    'baik',
    'rusak_ringan',
    'rusak_sedang',
    'rusak_parah',
    'hilang',
  ]),
  TransaksiController.approvePengembalian
);

/**
 * @swagger
 * /transaksi/{id}/reject-pengembalian:
 *   put:
 *     summary: Reject pengembalian (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pengembalian ditolak
 */
router.put(
  '/:id/reject-pengembalian',
  auth,
  requireRole(['admin']),
  TransaksiController.rejectPengembalian
);

/**
 * @swagger
 * /transaksi/{id}/kalkulasi-denda:
 *   post:
 *     summary: Simulasi denda (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hasil kalkulasi denda
 */
router.post(
  '/:id/kalkulasi-denda',
  auth,
  requireRole(['admin']),
  body('kondisi_buku').notEmpty().isIn([
    'baik',
    'rusak_ringan',
    'rusak_sedang',
    'rusak_parah',
    'hilang',
  ]),
  TransaksiController.calculateFinePreview
);

/**
 * @swagger
 * /transaksi/{id}/bayar-denda:
 *   post:
 *     summary: Bayar denda (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pembayaran berhasil
 */
router.post(
  '/:id/bayar-denda',
  auth,
  requireRole(['admin']),
  body('jumlah_bayar').isNumeric({ no_symbols: true }),
  TransaksiController.processPayment
);

/**
 * @swagger
 * /transaksi/bulk-bayar-denda:
 *   post:
 *     summary: Bayar banyak denda user sekaligus (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk payment berhasil
 */
router.post(
  '/bulk-bayar-denda',
  auth,
  requireRole(['admin']),
  body('transaksi_ids').isArray().notEmpty(),
  body('jumlah_bayar').isNumeric({ no_symbols: true }),
  body('user_id').notEmpty().isInt(),
  TransaksiController.bulkProcessPayment
);

/**
 * @swagger
 * /transaksi/{id}/request-perpanjangan:
 *   post:
 *     summary: Request perpanjangan (User only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Request perpanjangan masuk
 */
router.post(
  '/:id/request-perpanjangan',
  auth,
  requireRole(['user']),
  TransaksiController.requestPerpanjangan
);

/**
 * @swagger
 * /transaksi/{id}/approve-perpanjangan:
 *   put:
 *     summary: Approve perpanjangan (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perpanjangan disetujui
 */
router.put(
  '/:id/approve-perpanjangan',
  auth,
  requireRole(['admin']),
  TransaksiController.approvePerpanjangan
);

/**
 * @swagger
 * /transaksi/{id}/reject-perpanjangan:
 *   put:
 *     summary: Reject perpanjangan (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perpanjangan ditolak
 */
router.put(
  '/:id/reject-perpanjangan',
  auth,
  requireRole(['admin']),
  TransaksiController.rejectPerpanjangan
);

/**
 * @swagger
 * /transaksi/{id}/return-lost:
 *   put:
 *     summary: Kembalikan buku yang sempat hilang (Admin only)
 *     tags: [Transaksi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buku berhasil ditemukan dan dikembalikan
 */
router.put(
  '/:id/return-lost',
  auth,
  requireRole(['admin']),
  body('kondisi_buku').optional().isIn([
    'baik',
    'rusak_ringan',
    'rusak_sedang',
    'rusak_parah',
  ]),
  TransaksiController.returnLost
);

export default router;
