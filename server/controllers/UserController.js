import { body, validationResult } from 'express-validator';
import UserService from '../services/UserService.js';

export const validateUserUpdate = [
  body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username minimal 3 karakter'),
  body('nama_lengkap').optional().isString(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Format email tidak valid'),
  body('nis').optional({ checkFalsy: true }).isString(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role harus admin atau user'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status harus active atau inactive'),
  body('class').optional({ checkFalsy: true }).isString(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
];

export const validateUserCreate = [
  body('username').notEmpty().withMessage('Username tidak boleh kosong').isLength({ min: 3, max: 50 }),
  body('nama_lengkap').notEmpty().withMessage('Nama lengkap tidak boleh kosong'),
  body('password').notEmpty().withMessage('Password tidak boleh kosong').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Format email tidak valid'),
  body('nis').optional({ checkFalsy: true }).isString(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role harus admin atau user'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status harus active atau inactive'),
  body('class').optional({ checkFalsy: true }).isString(),
];

/**
 * Controller untuk mengelola data pengguna (Admin & Siswa).
 */
class UserController {
  /**
   * Mengambil semua daftar pengguna dengan filter opsional.
   * @param {import('express').Request} req - Express Request object (query: search, role, status, page)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getAll(req, res) {
    try {
      const result = await UserService.getAll(req.query);
      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil data user',
        data: result.data,
        totalItems: result.totalItems,
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil data user' });
    }
  }

  /**
   * Mengambil data satu pengguna berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getById(req, res) {
    try {
      const user = await UserService.getById(req.params.id);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      console.error('Error fetching user by id:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengambil detail user' });
    }
  }

  /**
   * Membuat pengguna baru (Admin memicu pendaftaran).
   * @param {import('express').Request} req - Express Request object (body: data user)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userData = await UserService.create({
        ...req.body,
        class: req.body.class,
      });

      return res.status(201).json({
        success: true,
        message: 'User berhasil ditambahkan',
        data: userData,
      });
    } catch (err) {
      console.error('Error creating user:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menambahkan user' });
    }
  }

  /**
   * Memperbarui data pengguna berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id, body: data user)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userData = await UserService.update(req.params.id, {
        ...req.body,
        class: req.body.class,
      });

      return res.status(200).json({
        success: true,
        message: 'User berhasil diupdate',
        data: userData,
      });
    } catch (err) {
      console.error('Error updating user:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengupdate user' });
    }
  }

  /**
   * Menghapus pengguna dari sistem berdasarkan ID.
   * @param {import('express').Request} req - Express Request object (params: id)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async delete(req, res) {
    try {
      await UserService.delete(req.params.id, req.user?.id);
      return res.status(200).json({ success: true, message: 'User berhasil dihapus' });
    } catch (err) {
      console.error('Error deleting user:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal menghapus user' });
    }
  }

  /**
   * Membuat banyak pengguna sekaligus melalui proses import.
   * @param {import('express').Request} req - Express Request object (body: users[])
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async bulkCreate(req, res) {
    try {
      const result = await UserService.bulkCreate(req.body.users);
      return res.status(201).json({
        success: true,
        message: `Berhasil mengimpor ${result.importedCount} user`,
        importedCount: result.importedCount,
        errors: result.errors,
      });
    } catch (err) {
      console.error('Error bulk creating users:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Gagal mengimpor user' });
    }
  }
}

export default UserController;
