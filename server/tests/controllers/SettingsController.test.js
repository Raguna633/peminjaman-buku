import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsController from '../../controllers/SettingsController.js';
import SettingsService from '../../services/SettingsService.js';
import { createMockRes } from '../helpers/httpMocks.js';

vi.mock('../../services/SettingsService.js', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('SettingsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return 200 and settings from service', async () => {
      // Arrange
      const mockSettings = { id: 1, max_borrow_limit: 3 };
      SettingsService.getSettings.mockResolvedValue(mockSettings);
      const res = createMockRes();

      // Act
      await SettingsController.getSettings({}, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockSettings);
      expect(SettingsService.getSettings).toHaveBeenCalled();
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      SettingsService.getSettings.mockRejectedValue(new Error('Fail'));
      const res = createMockRes();

      // Act
      await SettingsController.getSettings({}, res);

      // Assert
      expect(res.statusCode).toBe(500);
    });
  });

  describe('updateSettings', () => {
    it('should update settings and return 200', async () => {
      // Arrange
      const payload = { max_borrow_limit: 5 };
      const mockResult = { id: 1, ...payload };
      SettingsService.updateSettings.mockResolvedValue(mockResult);
      const req = { body: payload };
      const res = createMockRes();

      // Act
      await SettingsController.updateSettings(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockResult);
      expect(SettingsService.updateSettings).toHaveBeenCalledWith(payload);
    });
  });
});
