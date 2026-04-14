import db from '../models/index.js';
import AppError from '../utils/AppError.js';
import path from 'path';
import fs from 'fs';

const { Buku, Kategori, Transaksi } = db;

function deleteOldCover(sampulFileName) {
  if (sampulFileName && sampulFileName !== 'default.jpg') {
    const coverPath = path.resolve('public/uploads/covers', sampulFileName);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }
  }
}

class BukuService {
  static async getAll({ search, kategori, limit, offset, availableOnly } = {}) {
    const { Op } = db.Sequelize;
    const where = {};

    if (search) {
      where[Op.or] = [
        { judul: { [Op.like]: `%${search}%` } },
        { pengarang: { [Op.like]: `%${search}%` } },
        { isbn: { [Op.like]: `%${search}%` } },
      ];
    }
    if (kategori) {
      where.kategori_id = kategori;
    }
    if (availableOnly === 'true') {
      where.stok = { [Op.gt]: 0 };
    }

    const queryOptions = {
      where,
      include: [{ model: Kategori, as: 'kategori', attributes: ['id', 'nama'] }],
      order: [['created_at', 'DESC']],
    };

    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const result = await Buku.findAndCountAll(queryOptions);
    return { data: result.rows, totalItems: result.count };
  }

  static async getById(id) {
    const buku = await Buku.findByPk(id, {
      include: [{ model: Kategori, as: 'kategori', attributes: ['id', 'nama'] }],
    });
    if (!buku) {
      throw new AppError('Buku tidak ditemukan', 404);
    }
    return buku;
  }

  static async create(data) {
    const kategori = await Kategori.findByPk(data.kategori_id);
    const existing = await Buku.findOne({ where: { judul: data.judul} });
    if (!kategori) {
      throw new AppError('Kategori tidak valid', 400);
    }
    if (existing) {
      throw new AppError('Judul buku sudah digunakan', 400);
    }

    return Buku.create(data);
  }

  static async update(id, data) {
    const buku = await Buku.findByPk(id);
    if (!buku) {
      throw new AppError('Buku tidak ditemukan', 404);
    }

    if (data.kategori_id && data.kategori_id !== buku.kategori_id) {
      const kategori = await Kategori.findByPk(data.kategori_id);
      if (!kategori) {
        throw new AppError('Kategori tidak valid', 400);
      }
    }

    if (data.judul && data.judul !== buku.judul) {
      const existing = await Buku.findOne({ where: { judul: data.judul } });
      if (existing) {
        throw new AppError('Judul buku sudah digunakan', 400);
      }
    }

    if (data.sampul && data.sampul !== buku.sampul) {
      deleteOldCover(buku.sampul);
    }

    await buku.update(data);
    return buku;
  }

  static async delete(id) {
    const buku = await Buku.findByPk(id);
    if (!buku) {
      throw new AppError('Buku tidak ditemukan', 404);
    }

    const transactions = await Transaksi.findAll({ where: { buku_id: id } });
    if (transactions.length > 0) {
      const activeStatuses = ['pending', 'approved', 'overdue', 'return_pending', 'extension_pending', 'lost'];
      const hasActive = transactions.some(t => activeStatuses.includes(t.status));

      if (hasActive) {
        throw new AppError(
          'Buku tidak dapat dihapus karena sedang dalam peminjaman atau request aktif. Selesaikan transaksi terlebih dahulu.',
          400
        );
      } else {
        throw new AppError(
          'Buku tidak dapat dihapus karena memiliki riwayat transaksi (record data). Untuk integritas data perpustakaan, buku yang sudah pernah dipinjam tidak boleh dihapus secara permanen.',
          400
        );
      }
    }

    deleteOldCover(buku.sampul);
    await buku.destroy();
  }
}

export default BukuService;
