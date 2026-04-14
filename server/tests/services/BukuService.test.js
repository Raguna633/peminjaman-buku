import { describe, it, expect, vi, beforeEach } from 'vitest';
import BukuService from '../../services/BukuService.js';
import db from '../../models/index.js';
import { createMockBuku, createMockKategori, createMockTransaksi } from '../helpers/factories.js';
import AppError from '../../utils/AppError.js';
import fs from 'fs';

vi.mock('../../models/index.js', () => ({
  default: {
    Buku: {
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      findOne: vi.fn(),
    },
    Kategori: {
      findByPk: vi.fn(),
    },
    Transaksi: {
      findAll: vi.fn(),
    },
    Sequelize: {
      Op: {
        like: Symbol('like'),
        or: Symbol('or'),
        gt: Symbol('gt'),
      },
    },
  },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

describe('BukuService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return books with kategori include', async () => {
      // Arrange
      const mockResult = {
        rows: [createMockBuku({ id: 1, kategori: { id: 1, nama: 'Fiksi' } })],
        count: 1,
      };
      db.Buku.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await BukuService.getAll({ search: 'test' });

      // Assert
      expect(result).toEqual({ data: mockResult.rows, totalItems: mockResult.count });
      expect(db.Buku.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return book with kategori when found', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1 });
      db.Buku.findByPk.mockResolvedValue(mockBuku);

      // Act
      const result = await BukuService.getById(1);

      // Assert
      expect(result).toEqual(mockBuku);
    });

    it('should throw 404 when book not found', async () => {
      // Arrange
      db.Buku.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(BukuService.getById(999))
        .rejects.toThrow(new AppError('Buku tidak ditemukan', 404));
    });
  });

  describe('create', () => {
    it('should create book when kategori exists', async () => {
      // Arrange
      const payload = { judul: 'Buku Baru', kategori_id: 1 };
      db.Kategori.findByPk.mockResolvedValue(createMockKategori({ id: 1 }));
      db.Buku.findOne.mockResolvedValue(null);
      db.Buku.create.mockResolvedValue({ id: 2, ...payload });

      // Act
      const result = await BukuService.create(payload);

      // Assert
      expect(result.id).toBe(2);
      expect(db.Buku.create).toHaveBeenCalledWith(payload);
    });

    it('should throw 400 when kategori is invalid', async () => {
      // Arrange
      db.Kategori.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(BukuService.create({ kategori_id: 999 }))
        .rejects.toThrow(new AppError('Kategori tidak valid', 400));
    });
  });

  describe('update', () => {
    it('should update book when data is valid', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1, sampul: 'old.jpg' });
      db.Buku.findByPk.mockResolvedValue(mockBuku);
      db.Kategori.findByPk.mockResolvedValue(createMockKategori({ id: 1 }));
      db.Buku.findOne.mockResolvedValue(null);

      // Act
      const result = await BukuService.update(1, { judul: 'Updated' });

      // Assert
      expect(result).toEqual(mockBuku);
      expect(mockBuku.update).toHaveBeenCalledWith({ judul: 'Updated' });
    });

    it('should delete old cover file when new cover is provided', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1, sampul: 'old.jpg' });
      db.Buku.findByPk.mockResolvedValue(mockBuku);
      fs.existsSync.mockReturnValue(true);

      // Act
      await BukuService.update(1, { sampul: 'new.jpg' });

      // Assert
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete book when no transactions exist', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1 });
      db.Buku.findByPk.mockResolvedValue(mockBuku);
      db.Transaksi.findAll.mockResolvedValue([]);

      // Act
      await BukuService.delete(1);

      // Assert
      expect(mockBuku.destroy).toHaveBeenCalled();
    });

    it('should throw 400 when active transactions exist', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1 });
      db.Buku.findByPk.mockResolvedValue(mockBuku);
      db.Transaksi.findAll.mockResolvedValue([createMockTransaksi({ status: 'approved' })]);

      // Act & Assert
      await expect(BukuService.delete(1))
        .rejects.toThrow(new AppError('Buku tidak dapat dihapus karena sedang dalam peminjaman atau request aktif. Selesaikan transaksi terlebih dahulu.', 400));
    });

    it('should throw 400 when historical transactions exist', async () => {
      // Arrange
      const mockBuku = createMockBuku({ id: 1 });
      db.Buku.findByPk.mockResolvedValue(mockBuku);
      db.Transaksi.findAll.mockResolvedValue([createMockTransaksi({ status: 'returned' })]);

      // Act & Assert
      await expect(BukuService.delete(1))
        .rejects.toThrow(new AppError('Buku tidak dapat dihapus karena memiliki riwayat transaksi (record data). Untuk integritas data perpustakaan, buku yang sudah pernah dipinjam tidak boleh dihapus secara permanen.', 400));
    });
  });
});
