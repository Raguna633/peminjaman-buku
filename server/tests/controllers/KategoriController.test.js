import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import KategoriController from '../../controllers/KategoriController.js';
import KategoriService from '../../services/KategoriService.js';
import { createMockRes } from '../helpers/httpMocks.js';
import AppError from '../../utils/AppError.js';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
  body: vi.fn().mockReturnValue({
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    isString: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../services/KategoriService.js', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('KategoriController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('getAll', () => {
    it('should return 200 and list of categories from service', async () => {
      // Arrange
      const mockData = { data: [{ id: 1, nama: 'Sains' }], totalItems: 1 };
      KategoriService.getAll.mockResolvedValue(mockData);
      const req = { query: {} };
      const res = createMockRes();

      // Act
      await KategoriController.getAll(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Berhasil mengambil data kategori',
        ...mockData
      });
      expect(KategoriService.getAll).toHaveBeenCalledWith({});
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      KategoriService.getAll.mockRejectedValue(new Error('Unexpected'));
      const res = createMockRes();

      // Act
      await KategoriController.getAll({ query: {} }, res);

      // Assert
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return 200 and category details when found', async () => {
      // Arrange
      const mockKategori = { id: 1, nama: 'Sains' };
      KategoriService.getById.mockResolvedValue(mockKategori);
      const res = createMockRes();

      // Act
      await KategoriController.getById({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockKategori);
    });

    it('should return 404 when service throws 404 error', async () => {
      // Arrange
      KategoriService.getById.mockRejectedValue(new AppError('Not Found', 404));
      const res = createMockRes();

      // Act
      await KategoriController.getById({ params: { id: 99 } }, res);

      // Assert
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Not Found');
    });
  });

  describe('create', () => {
    it('should return 201 when creation is successful', async () => {
      // Arrange
      const mockNew = { id: 2, nama: 'Novel' };
      KategoriService.create.mockResolvedValue(mockNew);
      const req = { body: { nama: 'Novel' } };
      const res = createMockRes();

      // Act
      await KategoriController.create(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Kategori berhasil ditambahkan');
      expect(res.body.data).toEqual(mockNew);
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Error' }],
      });
      const res = createMockRes();

      // Act
      await KategoriController.create({ body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when service throws 400 error', async () => {
      // Arrange
      KategoriService.create.mockRejectedValue(new AppError('Already exists', 400));
      const res = createMockRes();

      // Act
      await KategoriController.create({ body: { nama: 'Eksis' } }, res);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Already exists');
    });
  });

  describe('update', () => {
    it('should return 200 and update category successfully', async () => {
      // Arrange
      const mockUpdated = { id: 1, nama: 'Sains Baru' };
      KategoriService.update.mockResolvedValue(mockUpdated);
      const req = { params: { id: 1 }, body: { nama: 'Sains Baru' } };
      const res = createMockRes();

      // Act
      await KategoriController.update(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Kategori berhasil diupdate');
      expect(res.body.data).toEqual(mockUpdated);
    });

    it('should return 404 when category not found in service', async () => {
      // Arrange
      KategoriService.update.mockRejectedValue(new AppError('Not Found', 404));
      const res = createMockRes();

      // Act
      await KategoriController.update({ params: { id: 99 }, body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(404);
    });
  });

  describe('delete', () => {
    it('should return 200 when deletion is successful', async () => {
      // Arrange
      KategoriService.delete.mockResolvedValue();
      const res = createMockRes();

      // Act
      await KategoriController.delete({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Kategori berhasil dihapus');
      expect(KategoriService.delete).toHaveBeenCalledWith(1);
    });

    it('should return 400 when service throws 400 error (related books)', async () => {
      // Arrange
      KategoriService.delete.mockRejectedValue(new AppError('Used by books', 400));
      const res = createMockRes();

      // Act
      await KategoriController.delete({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Used by books');
    });
  });
});
