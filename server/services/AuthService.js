import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

const { User } = db;

class AuthService {
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

  static async toggleDutyStatus(admin) {
    const newStatus = !admin.is_on_duty;
    await User.update(
      { is_on_duty: newStatus },
      { where: { id: admin.id } }
    );
    return { is_on_duty: newStatus };
  }

  static async checkDuty() {
    const count = await User.count({
      where: { role: 'admin', is_on_duty: true, status: 'active' },
    });
    return { admin_on_duty: count > 0 };
  }
}

export default AuthService;
