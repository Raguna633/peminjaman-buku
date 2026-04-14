import { describe, it, expect, vi, beforeEach } from 'vitest';

const { Settings } = vi.hoisted(() => ({
  Settings: {
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock('../../models/index.js', () => ({
  default: { Settings },
}));

import { loadSettings, getCachedSettings, refreshSettings } from '../../utils/settingsCache.js';

describe('settingsCache', () => {
  beforeEach(() => {
    Settings.findByPk.mockReset();
    Settings.create.mockReset();
  });

  it('loadSettings should create defaults when not exists', async () => {
    Settings.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });

    const settings = await loadSettings();

    expect(Settings.create).toHaveBeenCalled();
    expect(settings.id).toBe(1);
  });

  it('getCachedSettings should return cached value after load', async () => {
    Settings.findByPk.mockResolvedValue({ id: 1 });
    await loadSettings();

    const cached = getCachedSettings();

    expect(cached.id).toBe(1);
  });

  it('refreshSettings should update cache', async () => {
    Settings.findByPk.mockResolvedValue({ id: 2 });
    const refreshed = await refreshSettings();

    expect(refreshed.id).toBe(2);
  });
});
