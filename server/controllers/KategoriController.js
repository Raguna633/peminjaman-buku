import { validationResult, body } from 'express-validator';
import KategoriService from '../services/KategoriService.js';

export const validateKategori = [
  body('nama')
    .notEmpty().withMessage('Nama kategori tidak boleh kosong')
    .isLength({ max: 100 }).withMessage('Nama kategori maksimal 100 karakter'),
  body('deskripsi').optional().isString(),
];

class KategoriController {
  static async getAll(req, res) {
    try {
      const result = await KategoriService.getAll(req.query);
      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil data kategori',
        data: result.data,
        totalItems: result.totalItems,
      });
    } catch (err) {
      console.error('Error fetching kategori:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil data kategori' });
    }
  }

  static async getById(req, res) {
    try {
      const kategori = await KategoriService.getById(req.params.id);
      return res.status(200).json({ success: true, data: kategori });
    } catch (err) {
      console.error('Error fetching kategori by id:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil detail kategori' });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const kategori = await KategoriService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Kategori berhasil ditambahkan',
        data: kategori,
      });
    } catch (err) {
      console.error('Error creating kategori:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menambahkan kategori' });
    }
  }

  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const kategori = await KategoriService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Kategori berhasil diupdate',
        data: kategori,
      });
    } catch (err) {
      console.error('Error updating kategori:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengupdate kategori' });
    }
  }

  static async delete(req, res) {
    try {
      await KategoriService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Kategori berhasil dihapus',
      });
    } catch (err) {
      console.error('Error deleting kategori:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menghapus kategori' });
    }
  }
}

export default KategoriController;
