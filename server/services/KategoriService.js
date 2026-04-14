import db from '../models/index.js';
import AppError from '../utils/AppError.js';

const { Kategori, Buku } = db;

class KategoriService {
  static async getAll({ search, limit, offset } = {}) {
    const { Op } = db.Sequelize;
    const where = {};

    if (search) {
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { deskripsi: { [Op.like]: `%${search}%` } },
      ];
    }

    const queryOptions = {
      where,
      order: [['nama', 'ASC']],
    };

    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const result = await Kategori.findAndCountAll(queryOptions);
    return { data: result.rows, totalItems: result.count };
  }

  static async getById(id) {
    const kategori = await Kategori.findByPk(id);
    if (!kategori) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
    return kategori;
  }

  static async create({ nama, deskripsi }) {
    const existing = await Kategori.findOne({ where: { nama } });
    if (existing) {
      throw new AppError('Nama kategori sudah digunakan', 400);
    }
    return Kategori.create({ nama, deskripsi });
  }

  static async update(id, { nama, deskripsi }) {
    const kategori = await Kategori.findByPk(id);
    if (!kategori) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }

    if (nama !== kategori.nama) {
      const existing = await Kategori.findOne({ where: { nama } });
      if (existing) {
        throw new AppError('Nama kategori sudah digunakan', 400);
      }
    }

    await kategori.update({ nama, deskripsi });
    return kategori;
  }

  static async delete(id) {
    const kategori = await Kategori.findByPk(id);
    if (!kategori) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }

    const bukuCount = await Buku.count({ where: { kategori_id: id } });
    if (bukuCount > 0) {
      throw new AppError(
        `Tidak dapat menghapus kategori. Terdapat ${bukuCount} buku yang menggunakan kategori ini.`,
        400
      );
    }

    await kategori.destroy();
  }
}

export default KategoriService;
