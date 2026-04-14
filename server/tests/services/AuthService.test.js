import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../../services/AuthService.js';
import db from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../../utils/AppError.js';

vi.mock('../../models/index.js', () => ({
  default: {
    User: {
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_token'),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const payload = { username: 'newuser', password: 'password123', nama_lengkap: 'New User' };
      db.User.findOne.mockResolvedValue(null);
      db.User.create.mockResolvedValue({ id: 1, ...payload, role: 'user' });

      // Act
      const result = await AuthService.register(payload);

      // Assert
      expect(result.token).toBe('mock_token');
      expect(result.user.username).toBe('newuser');
      expect(db.User.create).toHaveBeenCalled();
    });

    it('should throw 400 when username already exists', async () => {
      // Arrange
      db.User.findOne.mockResolvedValue({ id: 1, username: 'exists' });

      // Act & Assert
      await expect(AuthService.register({ username: 'exists' }))
        .rejects.toThrow(new AppError('Username sudah terdaftar', 400));
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'user1', password: 'hashed', status: 'active', role: 'user' };
      db.User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await AuthService.login('user1', 'pass123');

      // Assert
      expect(result.token).toBe('mock_token');
      expect(result.user.id).toBe(1);
    });

    it('should throw 401 for incorrect password', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'user1', password: 'hashed', status: 'active' };
      db.User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(AuthService.login('user1', 'wrong'))
        .rejects.toThrow(new AppError('Username atau password salah', 401));
    });

    it('should throw 401 when account is disabled', async () => {
      // Arrange
      db.User.findOne.mockResolvedValue({ id: 1, status: 'disabled' });

      // Act & Assert
      await expect(AuthService.login('user1', 'pass'))
        .rejects.toThrow(new AppError('Akun Anda dinonaktifkan. Silakan hubungi administrator.', 401));
    });
  });

  describe('toggleDutyStatus', () => {
    it('should toggle is_on_duty and return new status', async () => {
      // Arrange
      const mockAdmin = { id: 100, role: 'admin', is_on_duty: false };

      // Act
      const result = await AuthService.toggleDutyStatus(mockAdmin);

      // Assert
      expect(result.is_on_duty).toBe(true);
      expect(db.User.update).toHaveBeenCalledWith(
        { is_on_duty: true },
        { where: { id: 100 } }
      );
    });
  });

  describe('checkDuty', () => {
    it('should return admin_on_duty true if any admin is on duty', async () => {
      // Arrange
      db.User.count.mockResolvedValue(1);

      // Act
      const result = await AuthService.checkDuty();

      // Assert
      expect(result.admin_on_duty).toBe(true);
      expect(db.User.count).toHaveBeenCalledWith(expect.objectContaining({
        where: { role: 'admin', is_on_duty: true, status: 'active' }
      }));
    });
  });
});
