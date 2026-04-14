import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import { refreshSettings } from '../utils/settingsCache.js';

const { User, Transaksi, Settings } = db;

class UserService {
  static async getAll({ search, role, status, class: userClass, limit, offset } = {}) {
    const whereClause = {};
    if (userClass) whereClause.class = userClass;
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { nama_lengkap: { [Op.like]: `%${search}%` } },
        { nis: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;

    const queryOptions = {
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    };
    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const users = await User.findAndCountAll(queryOptions);
    return { data: users.rows, totalItems: users.count };
  }

  static async getById(id) {
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }
    return user;
  }

  static async create({ username, password, nama_lengkap, nis, email, phone, role, status, class: userClass }) {
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
      password: hash,
      nama_lengkap,
      class: userClass,
      nis,
      email,
      phone,
      role: role || 'user',
      status: status || 'active',
    });

    const userData = newUser.toJSON();
    delete userData.password;
    return userData;
  }

  static async update(id, { username, nama_lengkap, nis, email, phone, role, status, password, class: userClass }) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        throw new AppError('Username sudah terdaftar', 400);
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new AppError('Email sudah terdaftar', 400);
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
    if (userClass !== undefined) updateData.class = userClass;
    if (nis !== undefined) updateData.nis = nis;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    const userData = user.toJSON();
    delete userData.password;
    return userData;
  }

  static async delete(id, requesterId) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    if (requesterId && requesterId === parseInt(id)) {
      throw new AppError('Tidak bisa menghapus akun sendiri', 400);
    }

    const activeStatuses = ['pending', 'approved', 'overdue', 'return_pending', 'extension_pending'];
    const activeTransaksi = await Transaksi.count({
      where: { user_id: id, status: { [Op.in]: activeStatuses } },
    });

    if (activeTransaksi > 0) {
      throw new AppError(
        `Tidak dapat menghapus user. Masih ada ${activeTransaksi} transaksi aktif.`,
        400
      );
    }

    await user.destroy();
  }

  static async bulkCreate(usersData) {
    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      throw new AppError('Data user tidak valid atau kosong', 400);
    }

    const validUsers = [];
    const errors = [];
    const salt = await bcrypt.genSalt(10);

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const { username, nama_lengkap, password, nis, email, phone, role, status } = userData;
      const userClass = userData.class || userData.kelas;

      if (!username || !nama_lengkap || !password) {
        errors.push({ line: i + 1, message: 'Username, Nama Lengkap, dan Password wajib diisi' });
        continue;
      }

      const existing = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            ...(nis ? [{ nis }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existing) {
        errors.push({ line: i + 1, message: `User dengan username/NIS/Email "${username}" sudah terdaftar` });
        continue;
      }

      const hashedPassword = await bcrypt.hash(password.toString(), salt);

      validUsers.push({
        username,
        password: hashedPassword,
        nama_lengkap,
        class: userClass,
        nis,
        email,
        phone,
        role: role || 'user',
        status: status || 'active',
      });
    }

    if (validUsers.length === 0) {
      throw new AppError('Tidak ada data valid untuk diimpor', 400, errors);
    }

    await User.bulkCreate(validUsers);

    // Sync classes to settings
    try {
      const importedClasses = [...new Set(validUsers.map(u => u.class).filter(Boolean))];
      if (importedClasses.length > 0) {
        const settings = await Settings.findByPk(1);
        if (settings) {
          const currentClasses = settings.kelas_list || [];
          const newClasses = importedClasses.filter(c => !currentClasses.includes(c));
          if (newClasses.length > 0) {
            const updatedClasses = [...currentClasses, ...newClasses];
            await settings.update({ kelas_list: updatedClasses });
            await refreshSettings();
          }
        }
      }
    } catch (syncError) {
      console.error('Error syncing classes to settings:', syncError);
    }

    return { importedCount: validUsers.length, errors: errors.length > 0 ? errors : undefined };
  }
}

export default UserService;
