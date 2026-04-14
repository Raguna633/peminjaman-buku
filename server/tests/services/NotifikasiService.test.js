import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotifikasiService from '../../services/NotifikasiService.js';
import db from '../../models/index.js';
import { createMockNotifikasi } from '../helpers/factories.js';

vi.mock('../../models/index.js', () => ({
  default: {
    Notifikasi: {
      findAll: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('NotifikasiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUnread', () => {
    it('should return unread notifications with count for a user', async () => {
      // Arrange
      const mockNotifications = [
        createMockNotifikasi({ id: 1, user_id: 1, is_read: false }),
        createMockNotifikasi({ id: 2, user_id: 1, is_read: false }),
      ];
      db.Notifikasi.findAll.mockResolvedValue(mockNotifications);

      // Act
      const result = await NotifikasiService.getUnread(1);

      // Assert
      expect(result.data).toEqual(mockNotifications);
      expect(result.count).toBe(2);
      expect(db.Notifikasi.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { user_id: 1, is_read: false },
      }));
    });
  });

  describe('markRead', () => {
    it('should update is_read status for a specific notification and user', async () => {
      // Arrange & Act
      await NotifikasiService.markRead(1, 1);

      // Assert
      expect(db.Notifikasi.update).toHaveBeenCalledWith(
        { is_read: true },
        { where: { id: 1, user_id: 1 } }
      );
    });
  });

  describe('markAllRead', () => {
    it('should update all unread notifications for a user', async () => {
      // Arrange & Act
      await NotifikasiService.markAllRead(1);

      // Assert
      expect(db.Notifikasi.update).toHaveBeenCalledWith(
        { is_read: true },
        { where: { user_id: 1, is_read: false } }
      );
    });
  });
});
