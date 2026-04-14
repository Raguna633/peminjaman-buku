import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransaksiService from '../../services/TransaksiService.js';
import db from '../../models/index.js';
import * as settingsCache from '../../utils/settingsCache.js';
import AppError from '../../utils/AppError.js';
import { createMockUser, createMockBuku, createMockTransaksi, createMockSettings } from '../helpers/factories.js';

vi.mock('../../models/index.js', () => {
  const mockTransaction = {
    commit: vi.fn(),
    rollback: vi.fn(),
    LOCK: { UPDATE: 'UPDATE' },
  };
  return {
    default: {
      Transaksi: {
        findAndCountAll: vi.fn(),
        findByPk: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findAll: vi.fn(),
      },
      Buku: {
        findByPk: vi.fn(),
        update: vi.fn(),
      },
      User: {
        count: vi.fn(),
        findByPk: vi.fn(),
      },
      Notifikasi: {
        create: vi.fn(),
      },
      Settings: {
        findByPk: vi.fn(),
      },
      sequelize: {
        transaction: vi.fn().mockResolvedValue(mockTransaction),
        where: vi.fn(),
        col: vi.fn(),
      },
      Sequelize: {
        Transaction: { ISOLATION_LEVELS: { READ_COMMITTED: 'READ_COMMITTED' } },
        where: vi.fn(),
        col: vi.fn(),
        Op: {
          in: Symbol('in'),
          gt: Symbol('gt'),
          or: Symbol('or'),
          and: Symbol('and'),
          like: Symbol('like'),
        },
      },
    },
  };
});

vi.mock('../../utils/settingsCache.js', () => ({
  getCachedSettings: vi.fn(),
  refreshSettings: vi.fn(),
}));

describe('TransaksiService', () => {
  let mockTransaction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      LOCK: { UPDATE: 'UPDATE' },
    };
    db.sequelize.transaction.mockResolvedValue(mockTransaction);
    settingsCache.getCachedSettings.mockReturnValue(createMockSettings());
  });

  describe('requestPeminjaman', () => {
    it('should throw error if no admin on duty', async () => {
      // Arrange
      db.User.count.mockResolvedValue(0);
      const user = createMockUser({ id: 1 });

      // Act & Assert
      await expect(TransaksiService.requestPeminjaman(user, 1))
        .rejects.toThrow(new AppError('Tidak ada admin berjaga saat ini. Silakan coba lagi nanti.', 400));
    });

    it('should create a pending transaction successfully', async () => {
      // Arrange
      db.User.count.mockResolvedValue(1); // admin on duty
      db.Buku.findByPk.mockResolvedValue(createMockBuku({ id: 1, stok: 5 }));
      db.Transaksi.findOne.mockResolvedValue(null); // no existing borrow
      db.Transaksi.count.mockResolvedValue(0); // below limit
      db.Transaksi.findAll.mockResolvedValue([]); // no unpaid fines
      db.Transaksi.create.mockResolvedValue({ id: 10 });
      db.Transaksi.findByPk.mockResolvedValue(createMockTransaksi({ id: 10 }));

      // Act
      await TransaksiService.requestPeminjaman(createMockUser({ id: 1 }), 1);

      // Assert
      expect(db.Transaksi.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if book stock is 0', async () => {
      // Arrange
      db.User.count.mockResolvedValue(1);
      db.Buku.findByPk.mockResolvedValue(createMockBuku({ id: 1, stok: 0 }));

      // Act & Assert
      await expect(TransaksiService.requestPeminjaman({ id: 1 }, 1))
        .rejects.toThrow(new AppError('Stok buku habis', 400));
    });
  });

  describe('approvePeminjaman', () => {
    it('should update status to approved and decrease stock', async () => {
      // Arrange
      const mockT = createMockTransaksi({ id: 10, status: 'pending', buku_id: 1 });
      db.Transaksi.findByPk.mockResolvedValue(mockT);
      db.Buku.findByPk.mockResolvedValue(createMockBuku({ id: 1, stok: 5 }));
      db.Transaksi.count.mockResolvedValue(0);

      // Act
      await TransaksiService.approvePeminjaman(10, { id: 100 });

      // Assert
      expect(db.Transaksi.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' }),
        expect.any(Object)
      );
      expect(db.Buku.update).toHaveBeenCalledWith(
        { stok: 4 },
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('calculateFinePreview', () => {
    it('should return correct fine calculation', async () => {
      // Arrange
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 3); // 3 days late
      const mockT = createMockTransaksi({ id: 10, tanggal_jatuh_tempo: dueDate, status: 'return_pending' });
      db.Transaksi.findByPk.mockResolvedValue(mockT);
      
      const settings = createMockSettings({
        denda_type: 'per_day',
        denda_per_day_amount: 1000,
        excluded_denda_dates: [],
      });
      settingsCache.getCachedSettings.mockReturnValue(settings);

      // Act
      const result = await TransaksiService.calculateFinePreview(10, 'baik', []);

      // Assert
      expect(result.kalkulasi.rincian_denda.denda_terlambat).toBe(3000);
      expect(result.kalkulasi.hari_terlambat).toBe(3);
    });
  });

  describe('processPayment', () => {
    it('should handle partial payment correctly', async () => {
      // Arrange
      const mockT = createMockTransaksi({ id: 10, status: 'returned', denda: 5000, denda_dibayar: 0 });
      db.Transaksi.findByPk.mockResolvedValue(mockT);

      // Act
      const result = await TransaksiService.processPayment(10, 2000);

      // Assert
      expect(db.Transaksi.update).toHaveBeenCalledWith(
        { denda_dibayar: 2000 },
        expect.any(Object)
      );
      expect(result.is_lunas).toBe(false);
      expect(result.sisa_denda).toBe(3000);
    });

    it('should handle full payment and return change', async () => {
      // Arrange
      const mockT = createMockTransaksi({ id: 11, status: 'returned', denda: 5000, denda_dibayar: 0 });
      db.Transaksi.findByPk.mockResolvedValue(mockT);

      // Act
      const result = await TransaksiService.processPayment(11, 6000);

      // Assert
      expect(db.Transaksi.update).toHaveBeenCalledWith(
        { denda_dibayar: 5000 },
        expect.any(Object)
      );
      expect(result.is_lunas).toBe(true);
      expect(result.kembalian).toBe(1000);
    });
  });
});
