import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserService from '../../services/UserService.js';
import db from '../../models/index.js';
import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import { createMockUser } from '../helpers/factories.js';

vi.mock('sequelize', () => ({
  Op: {
    like: Symbol('like'),
    or: Symbol('or'),
    in: Symbol('in'),
  },
}));

vi.mock('../../models/index.js', (async () => {
  const sequelize = await import('sequelize');
  return {
    default: {
      User: {
        findAndCountAll: vi.fn(),
        findByPk: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        bulkCreate: vi.fn(),
      },
      Transaksi: {
        count: vi.fn(),
      },
      Settings: {
        findByPk: vi.fn(),
      },
      Sequelize: {
        Op: sequelize.Op,
      },
    },
  };
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

vi.mock('../../utils/settingsCache.js', () => ({
  refreshSettings: vi.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of users without password', async () => {
      // Arrange
      const mockResult = {
        rows: [createMockUser({ id: 1, username: 'user1' })],
        count: 1,
      };
      db.User.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await UserService.getAll({ search: 'user' });

      // Assert
      expect(result.data).toEqual(mockResult.rows);
      expect(db.User.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        attributes: { exclude: ['password'] },
      }));
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = createMockUser({ id: 1 });
      db.User.findByPk.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getById(1);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 when user not found', async () => {
      // Arrange
      db.User.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getById(999))
        .rejects.toThrow(new AppError('User tidak ditemukan', 404));
    });
  });

  describe('create', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const payload = { username: 'new', password: 'pass', nama_lengkap: 'New' };
      db.User.findOne.mockResolvedValue(null);
      const mockNewUser = { ...payload, id: 2, toJSON: () => ({ id: 2, username: 'new' }) };
      db.User.create.mockResolvedValue(mockNewUser);

      // Act
      const result = await UserService.create(payload);

      // Assert
      expect(result.id).toBe(2);
      expect(db.User.create).toHaveBeenCalledWith(expect.objectContaining({
        password: 'hashed_password',
      }));
    });
  });

  describe('delete', () => {
    it('should delete user if no active transactions', async () => {
      // Arrange
      const mockUser = { ...createMockUser({ id: 1 }), destroy: vi.fn().mockResolvedValue(true) };
      db.User.findByPk.mockResolvedValue(mockUser);
      db.Transaksi.count.mockResolvedValue(0);

      // Act
      await UserService.delete(1, 100);

      // Assert
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should throw 400 when trying to delete self', async () => {
      // Arrange
      const mockUser = { ...createMockUser({ id: 1 }), destroy: vi.fn() };
      db.User.findByPk.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(UserService.delete(1, 1))
        .rejects.toThrow(new AppError('Tidak bisa menghapus akun sendiri', 400));
    });

    it('should throw 400 when user has active transactions', async () => {
      // Arrange
      const mockUser = { ...createMockUser({ id: 1 }), destroy: vi.fn() };
      db.User.findByPk.mockResolvedValue(mockUser);
      db.Transaksi.count.mockResolvedValue(2);

      // Act & Assert
      await expect(UserService.delete(1, 100))
        .rejects.toThrow(new AppError('Tidak dapat menghapus user. Masih ada 2 transaksi aktif.', 400));
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create valid users and skip invalid ones', async () => {
      // Arrange
      const usersData = [
        { username: 'user1', nama_lengkap: 'User 1', password: 'pass' },
        { username: 'exists', nama_lengkap: 'Exist', password: 'pass' },
      ];
      db.User.findOne.mockImplementation(({ where }) => {
        // Accessing the symbol-based key correctly
        const orClause = where[db.Sequelize.Op.or];
        if (orClause && orClause.some(o => o.username === 'exists')) {
          return Promise.resolve({ id: 1 });
        }
        return Promise.resolve(null);
      });
      db.User.bulkCreate.mockResolvedValue();

      // Act
      const result = await UserService.bulkCreate(usersData);

      // Assert
      expect(result.importedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(db.User.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ username: 'user1' }),
      ]));
    });
  });
});
