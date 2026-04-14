import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import AuthController from '../../controllers/AuthController.js';
import AuthService from '../../services/AuthService.js';
import { createMockRes } from '../helpers/httpMocks.js';
import AppError from '../../utils/AppError.js';
import { getIO } from '../../socket/index.js';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
  body: vi.fn().mockReturnValue({
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isEmail: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../services/AuthService.js', () => ({
  default: {
    register: vi.fn(),
    login: vi.fn(),
    getProfile: vi.fn(),
    toggleDutyStatus: vi.fn(),
    checkDuty: vi.fn(),
  },
}));

vi.mock('../../socket/index.js', () => ({
  getIO: vi.fn().mockReturnValue({
    emit: vi.fn(),
  }),
}));

describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('register', () => {
    it('should return 201 and data when registration is successful', async () => {
      // Arrange
      const mockResult = { user: { id: 1, username: 'test' }, token: 'token' };
      AuthService.register.mockResolvedValue(mockResult);
      const req = { body: { username: 'test', password: 'password' } };
      const res = createMockRes();

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toEqual(mockResult);
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Error' }],
      });
      const res = createMockRes();

      // Act
      await AuthController.register({ body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(400);
    });
  });

  describe('login', () => {
    it('should return 200 and data on successful login', async () => {
      // Arrange
      const mockResult = { user: { id: 1, username: 'user' }, token: 'token' };
      AuthService.login.mockResolvedValue(mockResult);
      const req = { body: { username: 'user', password: 'password' } };
      const res = createMockRes();

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult);
    });

    it('should return 401 when service throws 401', async () => {
      // Arrange
      AuthService.login.mockRejectedValue(new AppError('Invalid credentials', 401));
      const res = createMockRes();

      // Act
      await AuthController.login({ body: {} }, res);

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });

  describe('toggleDutyStatus', () => {
    it('should toggle duty status and emit socket event', async () => {
      // Arrange
      const mockUser = { id: 1, is_on_duty: false };
      const mockResult = { is_on_duty: true };
      AuthService.toggleDutyStatus.mockResolvedValue(mockResult);
      const req = { user: mockUser };
      const res = createMockRes();
      const mockIO = getIO();

      // Act
      await AuthController.toggleDutyStatus(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(AuthService.toggleDutyStatus).toHaveBeenCalledWith(mockUser);
      expect(mockIO.emit).toHaveBeenCalledWith('admin:duty_status', {
        adminId: 1,
        is_on_duty: true,
      });
    });
  });

  describe('checkDuty', () => {
    it('should return admin_on_duty status', async () => {
      // Arrange
      const mockResult = { admin_on_duty: true };
      AuthService.checkDuty.mockResolvedValue(mockResult);
      const res = createMockRes();

      // Act
      await AuthController.checkDuty({}, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult);
    });
  });
});
