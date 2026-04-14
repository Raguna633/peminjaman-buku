import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

const { User } = db;

/**
 * Service untuk mengelola logika autentikasi (Registrasi, Login, Profil).
 */
class AuthService {
  /**
   * Mendaftarkan pengguna baru ke sistem.
   * @param {Object} userData - Data pengguna yang akan didaftarkan.
   * @param {string} userData.username - Username baru.
   * @param {string} userData.nama_lengkap - Nama lengkap pengguna.
   * @param {string} [userData.phone] - Nomor telepon (opsional).
   * @param {string} userData.password - Password (akan di-hash).
   * @param {string} [userData.nis] - Nomor Induk Siswa (opsional).
   * @param {string} [userData.email] - Alamat email (opsional).
   * @param {string} [userData.class] - Kelas siswa (opsional).
   * @param {string} [userData.role='user'] - Peran pengguna (admin/user).
   * @returns {Promise<Object>} Berisi objek user dan token JWT.
   * @throws {AppError} Jika username, email, atau NIS sudah terdaftar.
   */
  static async register({ username, nama_lengkap, phone, password, nis, email, class: userClass, role }) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new AppError('Username sudah terdaftar', 400);
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new AppError('Email sudah terdaftar', 400);
      }
    }

    if (nis) {
      const existingNis = await User.findOne({ where: { nis } });
      if (existingNis) {
        throw new AppError('NIS sudah terdaftar', 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      nama_lengkap,
      class: userClass,
      nis,
      phone,
      email,
      role: role || 'user',
      password: hash,
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        nama_lengkap: newUser.nama_lengkap,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        is_on_duty: newUser.is_on_duty,
      },
      token,
    };
  }

  /**
   * Melakukan proses login pengguna.
   * @param {string} username - Username pengguna.
   * @param {string} password - Password mentah.
   * @returns {Promise<Object>} Berisi objek user dan token JWT.
   * @throws {AppError} Jika akun tidak ditemukan, tidak aktif, atau password salah.
   */
  static async login(username, password) {
    if (!process.env.JWT_SECRET) {
      throw new AppError('Konfigurasi server tidak valid', 500);
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError('Username atau password salah', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Akun Anda dinonaktifkan. Silakan hubungi administrator.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Username atau password salah', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        phone: user.phone,
        email: user.email,
        role: user.role,
        is_on_duty: user.is_on_duty,
      },
      token,
    };
  }

  /**
   * Mengembalikan filter data profil dari objek user.
   * @param {Object} user - Objek user dari database atau request.
   * @returns {Object} Data profil yang aman untuk dikirim ke client.
   */
  static getProfile(user) {
    return {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      phone: user.phone,
      email: user.email,
      role: user.role,
      is_on_duty: user.is_on_duty,
    };
  }

  /**
   * Mengubah status berjaga (duty status) seorang admin.
   * @param {Object} admin - Objek admin yang akan diubah statusnya.
   * @param {number} admin.id - ID admin.
   * @param {boolean} admin.is_on_duty - Status berjaga saat ini.
   * @returns {Promise<Object>} Status berjaga yang baru.
   */
  static async toggleDutyStatus(admin) {
    const newStatus = !admin.is_on_duty;
    await User.update(
      { is_on_duty: newStatus },
      { where: { id: admin.id } }
    );
    return { is_on_duty: newStatus };
  }

  /**
   * Memeriksa apakah ada admin yang sedang aktif berjaga.
   * @returns {Promise<Object>} Berisi boolean admin_on_duty.
   */
  static async checkDuty() {
    const count = await User.count({
      where: { role: 'admin', is_on_duty: true, status: 'active' },
    });
    return { admin_on_duty: count > 0 };
  }
}

export default AuthService;
