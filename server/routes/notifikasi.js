import express from 'express';
import NotifikasiController from '../controllers/NotifikasiController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifikasi
 *   description: API untuk manajemen notifikasi user
 */

/**
 * @swagger
 * /notifikasi/unread:
 *   get:
 *     summary: Ambil notifikasi yang belum dibaca
 *     tags: [Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar notifikasi unread
 */
router.get('/unread', auth, NotifikasiController.getUnread);

/**
 * @swagger
 * /notifikasi/{id}/read:
 *   put:
 *     summary: Tandai satu notifikasi sebagai telah dibaca
 *     tags: [Notifikasi]
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
 *         description: Berhasil diupdate
 */
router.put('/:id/read', auth, NotifikasiController.markRead);

/**
 * @swagger
 * /notifikasi/read-all:
 *   put:
 *     summary: Tandai semua notifikasi sebagai telah dibaca
 *     tags: [Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil update massal
 */
router.put('/read-all', auth, NotifikasiController.markAllRead);

export default router;
