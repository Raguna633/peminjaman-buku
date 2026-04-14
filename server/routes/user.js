import express from 'express';
import UserController, { validateUserUpdate, validateUserCreate } from '../controllers/UserController.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Semua endpoint User management hanya untuk Admin
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API untuk manajemen user (Admin only)
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Ambil semua user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data user
 */
router.get('/', auth, requireRole(['admin']), UserController.getAll);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Ambil user berdasarkan ID
 *     tags: [Users]
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
 *         description: Data user ditemukan
 *       404:
 *         description: User tidak ditemukan
 */
router.get('/:id', auth, requireRole(['admin']), UserController.getById);

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Buat user baru (Manual oleh Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 */
router.post('/', auth, requireRole(['admin']), validateUserCreate, UserController.create);

/**
 * @swagger
 * /user/bulk:
 *   post:
 *     summary: Import user secara massal
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Backup/Import berhasil
 */
router.post('/bulk', auth, requireRole(['admin']), UserController.bulkCreate);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update data user
 *     tags: [Users]
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
 *         description: User berhasil diupdate
 */
router.put('/:id', auth, requireRole(['admin']), validateUserUpdate, UserController.update);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Hapus user
 *     tags: [Users]
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
 *         description: User berhasil dihapus
 */
router.delete('/:id', auth, requireRole(['admin']), UserController.delete);

export default router;
