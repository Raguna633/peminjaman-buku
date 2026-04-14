import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import TransaksiController from '../../controllers/TransaksiController.js';
import TransaksiService from '../../services/TransaksiService.js';
import { getIO } from '../../socket/index.js';
import { createMockRes } from '../helpers/httpMocks.js';
import AppError from '../../utils/AppError.js';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
  body: vi.fn().mockReturnValue({
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isString: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../socket/index.js', () => ({
  getIO: vi.fn(),
}));

vi.mock('../../utils/logger.js', () => ({
  logError: vi.fn(),
}));

vi.mock('../../utils/notificationHelper.js', () => ({
  pushNotificationToUser: vi.fn(),
}));

vi.mock('../../services/TransaksiService.js', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByUser: vi.fn(),
    requestPeminjaman: vi.fn(),
    approvePeminjaman: vi.fn(),
    rejectPeminjaman: vi.fn(),
    bulkApprovePeminjaman: vi.fn(),
    requestPengembalian: vi.fn(),
    calculateFinePreview: vi.fn(),
    approvePengembalian: vi.fn(),
    rejectPengembalian: vi.fn(),
    processPayment: vi.fn(),
    bulkProcessPayment: vi.fn(),
    requestPerpanjangan: vi.fn(),
    approvePerpanjangan: vi.fn(),
    rejectPerpanjangan: vi.fn(),
    returnLost: vi.fn(),
  },
}));

describe('TransaksiController', () => {
  let ioMock;
  let emitMock;

  beforeEach(() => {
    vi.clearAllMocks();
    emitMock = vi.fn();
    ioMock = { to: vi.fn().mockReturnValue({ emit: emitMock }) };
    getIO.mockReturnValue(ioMock);
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('getAll', () => {
    it('should return 200 and data from service', async () => {
      // Arrange
      const mockResult = { data: [{ id: 1 }], totalItems: 1 };
      TransaksiService.getAll.mockResolvedValue(mockResult);
      const res = createMockRes();

      // Act
      await TransaksiController.getAll({ query: {} }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult.data);
    });
  });

  describe('requestPeminjaman', () => {
    it('should return 201 and emit socket event on success', async () => {
      // Arrange
      const mockResult = { transaksi: { id: 1 }, buku: { judul: 'Test' }, user: { id: 2 } };
      TransaksiService.requestPeminjaman.mockResolvedValue(mockResult);
      const req = { user: { id: 2 }, body: { buku_id: 101 } };
      const res = createMockRes();

      // Act
      await TransaksiController.requestPeminjaman(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(emitMock).toHaveBeenCalledWith('peminjaman:request', expect.any(Object));
    });

    it('should return 400 when service throws AppError', async () => {
      // Arrange
      TransaksiService.requestPeminjaman.mockRejectedValue(new AppError('Stock empty', 400));
      const res = createMockRes();

      // Act
      await TransaksiController.requestPeminjaman({ user: { id: 2 }, body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Stock empty');
    });
  });

  describe('approvePeminjaman', () => {
    it('should return 200 and emit approved event', async () => {
      // Arrange
      const mockResult = { transaksi: { id: 1, user_id: 2 }, buku: { judul: 'Test' } };
      TransaksiService.approvePeminjaman.mockResolvedValue(mockResult);
      const req = { user: { id: 100 }, params: { id: 1 } };
      const res = createMockRes();

      // Act
      await TransaksiController.approvePeminjaman(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(ioMock.to).toHaveBeenCalledWith('user:2');
      expect(emitMock).toHaveBeenCalledWith('peminjaman:approved', expect.any(Object));
    });
  });

  describe('processPayment', () => {
    it('should return 200 on successful payment', async () => {
      // Arrange
      const mockResult = { total_denda: 5000, bayar_sekarang: 5000, is_lunas: true };
      TransaksiService.processPayment.mockResolvedValue(mockResult);
      const req = { params: { id: 1 }, body: { jumlah_bayar: 5000 } };
      const res = createMockRes();

      // Act
      await TransaksiController.processPayment(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult);
    });
  });

  describe('bulkApprovePeminjaman', () => {
    it('should return 200 with success and failed lists', async () => {
      // Arrange
      const mockResult = { success: [1], failed: [{ id: 2, reason: 'Err' }] };
      TransaksiService.bulkApprovePeminjaman.mockResolvedValue(mockResult);
      const req = { user: { id: 100 }, body: { transaksi_ids: [1, 2] } };
      const res = createMockRes();

      // Act
      await TransaksiController.bulkApprovePeminjaman(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult);
    });
  });
});
