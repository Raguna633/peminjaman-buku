import express from 'express';
import multer from 'multer';
import path from 'path';
import BukuController, { validateBuku } from '../controllers/BukuController.js';
import { auth, requireRole } from '../middleware/auth.js';

// Konfigurasi Multer untuk Upload Gambar Sampul Buku
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/covers/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung, hanya gambar diperbolehkan'), false);
        }
    }
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Buku
 *   description: API untuk manajemen buku
 */

/**
 * @swagger
 * /buku:
 *   get:
 *     summary: Ambil semua daftar buku
 *     tags: [Buku]
 *     responses:
 *       200:
 *         description: Berhasil mengambil data buku
 */
router.get('/', BukuController.getAll);

/**
 * @swagger
 * /buku/{id}:
 *   get:
 *     summary: Ambil data buku berdasarkan ID
 *     tags: [Buku]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data buku ditemukan
 *       404:
 *         description: Buku tidak ditemukan
 */
router.get('/:id', BukuController.getById);

/**
 * @swagger
 * /buku:
 *   post:
 *     summary: Tambah buku baru (Admin only)
 *     tags: [Buku]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               pengarang:
 *                 type: string
 *               penerbit:
 *                 type: string
 *               tahun_terbit:
 *                 type: integer
 *               isbn:
 *                 type: string
 *               kategori_id:
 *                 type: integer
 *               stok:
 *                 type: integer
 *               kondisi:
 *                 type: string
 *               lokasi:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               sampul:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Buku berhasil ditambahkan
 */
router.post('/', auth, requireRole(['admin']), upload.single('sampul'), validateBuku, BukuController.create);

/**
 * @swagger
 * /buku/{id}:
 *   put:
 *     summary: Update data buku (Admin only)
 *     tags: [Buku]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               pengarang:
 *                 type: string
 *               penerbit:
 *                 type: string
 *               tahun_terbit:
 *                 type: integer
 *               stok:
 *                 type: integer
 *               sampul:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Buku berhasil diupdate
 */
router.put('/:id', auth, requireRole(['admin']), upload.single('sampul'), validateBuku, BukuController.update);

/**
 * @swagger
 * /buku/{id}:
 *   delete:
 *     summary: Hapus buku (Admin only)
 *     tags: [Buku]
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
 *         description: Buku berhasil dihapus
 */
router.delete('/:id', auth, requireRole(['admin']), BukuController.delete);

export default router;
