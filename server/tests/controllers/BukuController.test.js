import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import BukuController from '../../controllers/BukuController.js';
import BukuService from '../../services/BukuService.js';
import { createMockRes } from '../helpers/httpMocks.js';
import AppError from '../../utils/AppError.js';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
  body: vi.fn().mockReturnValue({
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isString: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../services/BukuService.js', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BukuController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('getAll', () => {
    it('should return 200 and list of books', async () => {
      // Arrange
      const mockResult = { data: [{ id: 1, judul: 'Test' }], totalItems: 1 };
      BukuService.getAll.mockResolvedValue(mockResult);
      const req = { query: {} };
      const res = createMockRes();

      // Act
      await BukuController.getAll(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult.data);
      expect(res.body.totalItems).toBe(1);
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      BukuService.getAll.mockRejectedValue(new Error('Fail'));
      const res = createMockRes();

      // Act
      await BukuController.getAll({ query: {} }, res);

      // Assert
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return 200 and book details when found', async () => {
      // Arrange
      const mockBuku = { id: 1, judul: 'Buku A' };
      BukuService.getById.mockResolvedValue(mockBuku);
      const res = createMockRes();

      // Act
      await BukuController.getById({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockBuku);
    });

    it('should return 404 when service throws 404', async () => {
      // Arrange
      BukuService.getById.mockRejectedValue(new AppError('Not Found', 404));
      const res = createMockRes();

      // Act
      await BukuController.getById({ params: { id: 99 } }, res);

      // Assert
      expect(res.statusCode).toBe(404);
    });
  });

  describe('create', () => {
    it('should return 201 when creation is successful', async () => {
      // Arrange
      const mockNew = { id: 1, judul: 'New' };
      BukuService.create.mockResolvedValue(mockNew);
      const req = { 
        body: { judul: 'New', kategori_id: 1 },
        file: { filename: 'cover.jpg' }
      };
      const res = createMockRes();

      // Act
      await BukuController.create(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toEqual(mockNew);
      expect(BukuService.create).toHaveBeenCalledWith(expect.objectContaining({
        sampul: 'cover.jpg'
      }));
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Error' }],
      });
      const res = createMockRes();

      // Act
      await BukuController.create({ body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(400);
    });
  });

  describe('update', () => {
    it('should return 200 and updated book', async () => {
      // Arrange
      const mockUpdated = { id: 1, judul: 'Updated' };
      BukuService.update.mockResolvedValue(mockUpdated);
      const req = { 
        params: { id: 1 }, 
        body: { judul: 'Updated' },
        file: { filename: 'new.jpg' }
      };
      const res = createMockRes();

      // Act
      await BukuController.update(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockUpdated);
      expect(BukuService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        sampul: 'new.jpg'
      }));
    });

    it('should return 400 when service throws 400', async () => {
      // Arrange
      BukuService.update.mockRejectedValue(new AppError('Invalid', 400));
      const res = createMockRes();

      // Act
      await BukuController.update({ params: { id: 1 }, body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(400);
    });
  });

  describe('delete', () => {
    it('should return 200 when deletion successful', async () => {
      // Arrange
      BukuService.delete.mockResolvedValue();
      const res = createMockRes();

      // Act
      await BukuController.delete({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Buku berhasil dihapus');
    });

    it('should return 400 when service throws 400 (active transactions)', async () => {
      // Arrange
      BukuService.delete.mockRejectedValue(new AppError('Active trans', 400));
      const res = createMockRes();

      // Act
      await BukuController.delete({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Active trans');
    });
  });
});
