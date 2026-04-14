import { describe, it, expect, vi, beforeEach } from 'vitest';

let scheduledCallback;
const { schedule } = vi.hoisted(() => ({
  schedule: vi.fn((expr, cb) => {
    scheduledCallback = cb;
  }),
}));
vi.mock('node-cron', () => ({ default: { schedule } }));

const { getCachedSettings } = vi.hoisted(() => ({
  getCachedSettings: vi.fn(),
}));
vi.mock('../../utils/settingsCache.js', () => ({ getCachedSettings }));

const ioMock = vi.hoisted(() => ({
  to: vi.fn(() => ({ emit: vi.fn() })),
}));
const { getIO } = vi.hoisted(() => ({
  getIO: vi.fn(() => ioMock),
}));
vi.mock('../../socket/index.js', () => ({ getIO }));

const { Notifikasi, Transaksi, Sequelize, Buku, User } = vi.hoisted(() => ({
  Notifikasi: {
    destroy: vi.fn(),
    create: vi.fn(),
  },
  Transaksi: {
    update: vi.fn(),
    findAll: vi.fn(),
  },
  Sequelize: {
    Op: { lt: 'lt', is: 'is', and: 'and' },
    fn: vi.fn(),
    col: vi.fn(),
    where: vi.fn((...args) => ({ whereArgs: args })),
  },
  Buku: {},
  User: {},
}));

vi.mock('../../models/index.js', () => ({
  default: { Notifikasi, Transaksi, Buku, User, Sequelize },
}));

import { startDailyCleanupJob } from '../../jobs/dailyCleanup.js';

describe('dailyCleanup job', () => {
  beforeEach(() => {
    schedule.mockClear();
    Notifikasi.destroy.mockReset();
    Notifikasi.create.mockReset();
    Transaksi.update.mockReset();
    Transaksi.findAll.mockReset();
    getCachedSettings.mockReset();
    ioMock.to.mockClear();
  });

  it('should schedule and run cleanup tasks', async () => {
    getCachedSettings.mockReturnValue({ reminder_days_before_due: 2 });
    Transaksi.findAll.mockResolvedValue([
      { id: 1, user_id: 10, buku: { judul: 'Buku A' } },
    ]);

    startDailyCleanupJob();

    expect(schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));

    await scheduledCallback();

    expect(Notifikasi.destroy).toHaveBeenCalled();
    expect(Transaksi.update).toHaveBeenCalled();
    expect(Notifikasi.create).toHaveBeenCalled();
    expect(ioMock.to).toHaveBeenCalledWith('user:10');
  });
});
