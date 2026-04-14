import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import UserController from '../../controllers/UserController.js';
import UserService from '../../services/UserService.js';
import { createMockRes } from '../helpers/httpMocks.js';
import AppError from '../../utils/AppError.js';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
  body: vi.fn().mockReturnValue({
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    isEmail: vi.fn().mockReturnThis(),
    isString: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../services/UserService.js', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkCreate: vi.fn(),
  },
}));

describe('UserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('getAll', () => {
    it('should return 200 and data from service', async () => {
      // Arrange
      const mockResult = { data: [{ id: 1, username: 'admin' }], totalItems: 1 };
      UserService.getAll.mockResolvedValue(mockResult);
      const res = createMockRes();

      // Act
      await UserController.getAll({ query: {} }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult.data);
    });
  });

  describe('getById', () => {
    it('should return 200 and user data', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'user' };
      UserService.getById.mockResolvedValue(mockUser);
      const res = createMockRes();

      // Act
      await UserController.getById({ params: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockUser);
    });

    it('should return 404 when service throws 404', async () => {
      // Arrange
      UserService.getById.mockRejectedValue(new AppError('Not found', 404));
      const res = createMockRes();

      // Act
      await UserController.getById({ params: { id: 99 } }, res);

      // Assert
      expect(res.statusCode).toBe(404);
    });
  });

  describe('create', () => {
    it('should return 201 on success', async () => {
      // Arrange
      const mockUser = { id: 2, username: 'new' };
      UserService.create.mockResolvedValue(mockUser);
      const req = { body: { username: 'new', password: 'pass', nama_lengkap: 'New' } };
      const res = createMockRes();

      // Act
      await UserController.create(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should return 200 on success', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'updated' };
      UserService.update.mockResolvedValue(mockUser);
      const req = { params: { id: 1 }, body: { nama_lengkap: 'Updated' } };
      const res = createMockRes();

      // Act
      await UserController.update(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should return 200 on success', async () => {
      // Arrange
      UserService.delete.mockResolvedValue();
      const req = { user: { id: 1 }, params: { id: 2 } };
      const res = createMockRes();

      // Act
      await UserController.delete(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
    });
  });

  describe('bulkCreate', () => {
    it('should return 201 on success', async () => {
      // Arrange
      const mockResult = { importedCount: 5 };
      UserService.bulkCreate.mockResolvedValue(mockResult);
      const req = { body: { users: [{ username: 'u1' }] } };
      const res = createMockRes();

      // Act
      await UserController.bulkCreate(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.importedCount).toBe(5);
    });
  });
});
