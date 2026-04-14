import { validationResult, body } from 'express-validator';
import BukuService from '../services/BukuService.js';

export const validateBuku = [
  body('judul').notEmpty().withMessage('Judul buku tidak boleh kosong').isLength({ max: 200 }),
  body('pengarang').optional().isLength({ max: 100 }).withMessage('Pengarang maksimal 100 karakter'),
  body('penerbit').optional().isLength({ max: 100 }).withMessage('Penerbit maksimal 100 karakter'),
  body('tahun_terbit').notEmpty().withMessage('Tahun terbit tidak boleh kosong').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Tahun terbit tidak valid'),
  body('isbn').optional({ checkFalsy: true }).isLength({ max: 50 }),
  body('kategori_id').notEmpty().withMessage('Kategori ID tidak boleh kosong').isInt(),
  body('stok').notEmpty().withMessage('Stok tidak boleh kosong').isInt({ min: 0 }),
  // body('kondisi').notEmpty().isIn(['banyak_baik', 'banyak_rusak_ringan', 'banyak_rusak_sedang', 'banyak_rusak_parah', 'hilang']).withMessage('Kondisi tidak valid'),
  body('lokasi').optional().isLength({ max: 100 }),
  body('deskripsi').optional().isString(),
];

/**
 * Controller untuk mengelola data buku (CRUD).
 */
class BukuController {
  /**
   * Mengambil semua daftar buku berdasarkan kriteria pencarian dan pagination.
   * @param {import('express').Request} req - Express Request object (query: search, kategori, limit, offset, availableOnly)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getAll(req, res) {
    try {
      const result = await BukuService.getAll(req.query);
      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil data buku',
        data: result.data,
        totalItems: result.totalItems,
      });
    } catch (err) {
      console.error('Error fetching buku:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil data buku' });
    }
  }

  /**
   * Mengambil satu data buku berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getById(req, res) {
    try {
      const buku = await BukuService.getById(req.params.id);
      return res.status(200).json({ success: true, data: buku });
    } catch (err) {
      console.error('Error fetching buku by id:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil detail buku' });
    }
  }

  /**
   * Menambahkan buku baru ke sistem (termasuk upload sampul).
   * @param {import('express').Request} req - Express Request object (body: data buku, file: sampul)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const bukuData = { ...req.body };
      if (req.file) {
        bukuData.sampul = req.file.filename;
      }

      const buku = await BukuService.create(bukuData);
      return res.status(201).json({
        success: true,
        message: 'Buku berhasil ditambahkan',
        data: buku,
      });
    } catch (err) {
      console.error('Error creating buku:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menambahkan data buku' });
    }
  }

  /**
   * Memperbarui data buku berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id, body: data buku, file: sampul)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updateData = { ...req.body };
      if (req.file) {
        updateData.sampul = req.file.filename;
      }

      const buku = await BukuService.update(req.params.id, updateData);
      return res.status(200).json({
        success: true,
        message: 'Buku berhasil diupdate',
        data: buku,
      });
    } catch (err) {
      console.error('Error updating buku:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengupdate data buku' });
    }
  }

  /**
   * Menghapus buku dari sistem berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async delete(req, res) {
    try {
      await BukuService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Buku berhasil dihapus',
      });
    } catch (err) {
      console.error('Error deleting buku:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menghapus buku' });
    }
  }
}

export default BukuController;
