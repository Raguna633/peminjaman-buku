import db from '../models/index.js';
import AppError from '../utils/AppError.js';

const { Kategori, Buku } = db;

/**
 * Service untuk mengelola kategori buku.
 */
class KategoriService {
  /**
   * Mengambil semua daftar kategori dengan filter pencarian.
   * @param {Object} [options] - Objek filter.
   * @param {string} [options.search] - Kata kunci pencarian (nama, deskripsi).
   * @param {number} [options.limit] - Batas jumlah data.
   * @param {number} [options.offset] - Titik awal data.
   * @returns {Promise<Object>} Berisi array data kategori dan total item.
   */
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

  /**
   * Mengambil satu kategori berdasarkan ID.
   * @param {number} id - ID Kategori.
   * @returns {Promise<Object>} Objek kategori.
   * @throws {AppError} Jika kategori tidak ditemukan.
   */
  static async getById(id) {
    const kategori = await Kategori.findByPk(id);
    if (!kategori) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
    return kategori;
  }

  /**
   * Menambahkan kategori baru.
   * @param {Object} data - Data kategori.
   * @param {string} data.nama - Nama kategori (harus unik).
   * @param {string} [data.deskripsi] - Keterangan kategori.
   * @returns {Promise<Object>} Kategori yang baru dibuat.
   * @throws {AppError} Jika nama kategori sudah ada.
   */
  static async create({ nama, deskripsi }) {
    const existing = await Kategori.findOne({ where: { nama } });
    if (existing) {
      throw new AppError('Nama kategori sudah digunakan', 400);
    }
    return Kategori.create({ nama, deskripsi });
  }

  /**
   * Memperbarui data kategori.
   * @param {number} id - ID Kategori yang diupdate.
   * @param {Object} data - Objek perbaruan.
   * @param {string} data.nama - Nama kategori baru.
   * @param {string} [data.deskripsi] - Deskripsi kategori baru.
   * @returns {Promise<Object>} Objek kategori setelah diperbarui.
   * @throws {AppError} Jika kategori tidak ditemukan atau nama baru sudah digunakan.
   */
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

  /**
   * Menghapus kategori berdasarkan ID.
   * @param {number} id - ID Kategori.
   * @throws {AppError} Jika kategori tidak ditemukan atau masih ada buku yang terikat.
   */
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
