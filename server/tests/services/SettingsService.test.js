import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsService from '../../services/SettingsService.js';
import db from '../../models/index.js';
import * as settingsCache from '../../utils/settingsCache.js';

vi.mock('../../models/index.js', () => ({
  default: {
    Settings: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../utils/settingsCache.js', () => ({
  refreshSettings: vi.fn(),
  getCachedSettings: vi.fn(),
  loadSettings: vi.fn(),
}));

describe('SettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return cached settings if available', async () => {
      // Arrange
      const mockSettings = { max_borrow_limit: 3 };
      settingsCache.getCachedSettings.mockReturnValue(mockSettings);

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual(mockSettings);
      expect(settingsCache.loadSettings).not.toHaveBeenCalled();
    });

    it('should load and return settings if cache is empty', async () => {
      // Arrange
      const mockSettings = { max_borrow_limit: 5 };
      settingsCache.getCachedSettings.mockReturnValue(null);
      settingsCache.loadSettings.mockResolvedValue(mockSettings);

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual(mockSettings);
      expect(settingsCache.loadSettings).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update settings in DB and refresh cache', async () => {
      // Arrange
      const payload = { max_borrow_limit: 10 };
      const refreshedSettings = { ...payload, id: 1 };
      settingsCache.refreshSettings.mockResolvedValue(refreshedSettings);

      // Act
      const result = await SettingsService.updateSettings(payload);

      // Assert
      expect(db.Settings.update).toHaveBeenCalledWith(payload, { where: { id: 1 } });
      expect(settingsCache.refreshSettings).toHaveBeenCalled();
      expect(result).toEqual(refreshedSettings);
    });
  });
});
