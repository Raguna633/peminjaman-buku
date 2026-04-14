import express from 'express';
import KategoriController, { validateKategori } from '../controllers/KategoriController.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kategori
 *   description: API untuk manajemen kategori buku
 */

/**
 * @swagger
 * /kategori:
 *   get:
 *     summary: Ambil semua kategori
 *     tags: [Kategori]
 *     responses:
 *       200:
 *         description: Berhasil mengambil data kategori
 */
router.get('/', KategoriController.getAll);

/**
 * @swagger
 * /kategori/{id}:
 *   get:
 *     summary: Ambil kategori berdasarkan ID
 *     tags: [Kategori]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data kategori ditemukan
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.get('/:id', KategoriController.getById);

/**
 * @swagger
 * /kategori:
 *   post:
 *     summary: Tambah kategori baru (Admin only)
 *     tags: [Kategori]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kategori berhasil dibuat
 */
router.post('/', auth, requireRole(['admin']), validateKategori, KategoriController.create);

/**
 * @swagger
 * /kategori/{id}:
 *   put:
 *     summary: Update kategori (Admin only)
 *     tags: [Kategori]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategori berhasil diupdate
 */
router.put('/:id', auth, requireRole(['admin']), validateKategori, KategoriController.update);

/**
 * @swagger
 * /kategori/{id}:
 *   delete:
 *     summary: Hapus kategori (Admin only)
 *     tags: [Kategori]
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
 *         description: Kategori berhasil dihapus
 */
router.delete('/:id', auth, requireRole(['admin']), KategoriController.delete);

export default router;
