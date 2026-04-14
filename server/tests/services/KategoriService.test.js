import { describe, it, expect, vi, beforeEach } from 'vitest';
import KategoriService from '../../services/KategoriService.js';
import db from '../../models/index.js';
import { createMockKategori } from '../helpers/factories.js';
import AppError from '../../utils/AppError.js';

vi.mock('../../models/index.js', () => ({
  default: {
    Kategori: {
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    },
    Buku: {
      findOne: vi.fn(),
      count: vi.fn(),
    },
    Sequelize: {
      Op: {
        like: Symbol('like'),
        or: Symbol('or'),
      },
    },
  },
}));

describe('KategoriService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return categories with count when query is valid', async () => {
      // Arrange
      const mockResult = {
        rows: [createMockKategori({ id: 1, nama: 'Fiksi' })],
        count: 1,
      };
      db.Kategori.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await KategoriService.getAll({ search: 'fiksi' });

      // Assert
      expect(result).toEqual({ data: mockResult.rows, totalItems: mockResult.count });
      expect(db.Kategori.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        order: [['nama', 'ASC']],
      }));
    });
  });

  describe('getById', () => {
    it('should return category when found', async () => {
      // Arrange
      const mockKategori = createMockKategori({ id: 1 });
      db.Kategori.findByPk.mockResolvedValue(mockKategori);

      // Act
      const result = await KategoriService.getById(1);

      // Assert
      expect(result).toEqual(mockKategori);
      expect(db.Kategori.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw 404 when category not found', async () => {
      // Arrange
      db.Kategori.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(KategoriService.getById(999))
        .rejects.toThrow(new AppError('Kategori tidak ditemukan', 404));
    });
  });

  describe('create', () => {
    it('should create category when name is unique', async () => {
      // Arrange
      const payload = { nama: 'Baru', deskripsi: 'Desc' };
      db.Kategori.findOne.mockResolvedValue(null);
      db.Kategori.create.mockResolvedValue({ id: 2, ...payload });

      // Act
      const result = await KategoriService.create(payload);

      // Assert
      expect(result.id).toBe(2);
      expect(db.Kategori.create).toHaveBeenCalledWith(payload);
    });

    it('should throw 400 when name already exists', async () => {
      // Arrange
      db.Kategori.findOne.mockResolvedValue({ id: 1, nama: 'Eksis' });

      // Act & Assert
      await expect(KategoriService.create({ nama: 'Eksis' }))
        .rejects.toThrow(new AppError('Nama kategori sudah digunakan', 400));
    });
  });

  describe('update', () => {
    it('should update category when data is valid', async () => {
      // Arrange
      const mockKategori = createMockKategori({ id: 1, nama: 'Lama' });
      db.Kategori.findByPk.mockResolvedValue(mockKategori);
      db.Kategori.findOne.mockResolvedValue(null);

      // Act
      const result = await KategoriService.update(1, { nama: 'Baru' });

      // Assert
      expect(result).toEqual(mockKategori);
      expect(mockKategori.update).toHaveBeenCalledWith({ nama: 'Baru', deskripsi: undefined });
    });

    it('should throw 404 when category not found', async () => {
      // Arrange
      db.Kategori.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(KategoriService.update(999, { nama: 'Baru' }))
        .rejects.toThrow(new AppError('Kategori tidak ditemukan', 404));
    });
  });

  describe('delete', () => {
    it('should delete category when no books use it', async () => {
      // Arrange
      const mockKategori = createMockKategori({ id: 1 });
      db.Kategori.findByPk.mockResolvedValue(mockKategori);
      db.Buku.count.mockResolvedValue(0);

      // Act
      await KategoriService.delete(1);

      // Assert
      expect(mockKategori.destroy).toHaveBeenCalled();
    });

    it('should throw 400 when books still use this category', async () => {
      // Arrange
      const mockKategori = createMockKategori({ id: 1 });
      db.Kategori.findByPk.mockResolvedValue(mockKategori);
      db.Buku.count.mockResolvedValue(2);

      // Act & Assert
      await expect(KategoriService.delete(1))
        .rejects.toThrow(new AppError('Tidak dapat menghapus kategori. Terdapat 2 buku yang menggunakan kategori ini.', 400));
    });
  });
});
