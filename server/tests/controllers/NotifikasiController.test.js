import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotifikasiController from '../../controllers/NotifikasiController.js';
import NotifikasiService from '../../services/NotifikasiService.js';
import { createMockRes } from '../helpers/httpMocks.js';

vi.mock('../../services/NotifikasiService.js', () => ({
  default: {
    getUnread: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

describe('NotifikasiController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUnread', () => {
    it('should return 200 and unread notifications from service', async () => {
      // Arrange
      const mockResult = { data: [{ id: 1, message: 'Test' }], count: 1 };
      NotifikasiService.getUnread.mockResolvedValue(mockResult);
      const req = { user: { id: 1 } };
      const res = createMockRes();

      // Act
      await NotifikasiController.getUnread(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult.data);
      expect(res.body.count).toBe(mockResult.count);
      expect(NotifikasiService.getUnread).toHaveBeenCalledWith(1);
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      NotifikasiService.getUnread.mockRejectedValue(new Error('Fail'));
      const res = createMockRes();

      // Act
      await NotifikasiController.getUnread({ user: { id: 1 } }, res);

      // Assert
      expect(res.statusCode).toBe(500);
    });
  });

  describe('markRead', () => {
    it('should call service markRead and return 200', async () => {
      // Arrange
      NotifikasiService.markRead.mockResolvedValue();
      const req = { user: { id: 1 }, params: { id: 10 } };
      const res = createMockRes();

      // Act
      await NotifikasiController.markRead(req, res);

      // Assert
      expect(NotifikasiService.markRead).toHaveBeenCalledWith(10, 1);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('should call service markAllRead and return 200', async () => {
      // Arrange
      NotifikasiService.markAllRead.mockResolvedValue();
      const req = { user: { id: 1 } };
      const res = createMockRes();

      // Act
      await NotifikasiController.markAllRead(req, res);

      // Assert
      expect(NotifikasiService.markAllRead).toHaveBeenCalledWith(1);
      expect(res.statusCode).toBe(200);
    });
  });
});
