import 'dotenv/config';
import { validationResult } from 'express-validator';
import AuthService from '../services/AuthService.js';

/**
 * Controller untuk menangani proses autentikasi (Registrasi, Login, Profil).
 */
class AuthController {
  /**
   * Menangani pendaftaran/registrasi siswa baru.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array(),
        });
      }

      const body = req.body;
      const result = await AuthService.register({
        username: body.username?.trim(),
        nama_lengkap: body.nama_lengkap?.trim(),
        phone: body.phone?.trim(),
        password: body.password?.trim(),
        nis: body.nis?.trim(),
        email: body.email?.trim(),
        class: body.class?.trim(),
        role: body.role?.trim() || 'user',
      });

      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: result,
      });
    } catch (err) {
      console.error('Error registering:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Terjadi kesalahan saat registrasi',
      });
    }
  }

  /**
   * Menangani proses login pengguna.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array(),
        });
      }

      const body = req.body;
      const result = await AuthService.login(
        body.username?.trim(),
        body.password?.trim()
      );

      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: result,
      });
    } catch (err) {
      console.error('Error logging in:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Terjadi kesalahan saat login',
      });
    }
  }

  /**
   * Mengambil data profil pengguna yang sedang login.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async getProfile(req, res) {
    const profileData = AuthService.getProfile(req.user);
    return res.status(200).json({
      message: 'User profile data',
      data: profileData,
    });
  }

  /**
   * Mengubah status berjaga (duty status) admin.
   * @param {import('express').Request} req - Express Request object
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async toggleDutyStatus(req, res) {
    try {
      const result = await AuthService.toggleDutyStatus(req.user);

      // Broadcast to all clients — socket stays in controller
      try {
        const { getIO } = await import('../socket/index.js');
        const io = getIO();
        io.emit('admin:duty_status', {
          adminId: req.user.id,
          is_on_duty: result.is_on_duty,
        });
      } catch (_socketErr) {
        // Socket not critical
      }

      return res.status(200).json({
        success: true,
        message: result.is_on_duty
          ? 'Kamu sekarang sedang berjaga'
          : 'Kamu sudah selesai berjaga',
        data: result,
      });
    } catch (err) {
      console.error('Error toggling duty:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Gagal mengubah status berjaga',
      });
    }
  }

  /**
   * Memeriksa apakah ada admin yang sedang berjaga.
   * @param {import('express').Request} _req - Express Request object (tidak digunakan)
   * @param {import('express').Response} res - Express Response object
   * @returns {Promise<import('express').Response>} JSON response
   */
  static async checkDuty(_req, res) {
    try {
      const result = await AuthService.checkDuty();
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error checking duty:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Gagal memeriksa status admin berjaga',
      });
    }
  }
}

export default AuthController;
