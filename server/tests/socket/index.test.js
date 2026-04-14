import { describe, it, expect, vi, beforeEach } from 'vitest';

const useMock = vi.hoisted(() => vi.fn());
const onMock = vi.hoisted(() => vi.fn());
const ServerMock = vi.hoisted(() =>
  vi.fn(function Server() {
    this.use = useMock;
    this.on = onMock;
  })
);

vi.mock('socket.io', () => ({
  Server: ServerMock,
}));

vi.mock('../../models/index.js', () => ({
  default: { User: {}, Notifikasi: {}, Transaksi: {}, Buku: {}, Sequelize: { Op: {} } },
}));

import { initSocket, getIO } from '../../socket/index.js';

describe('socket', () => {
  beforeEach(() => {
    useMock.mockReset();
    onMock.mockReset();
    ServerMock.mockClear();
    process.env.CLIENT_URL = 'http://localhost:8080';
  });

  it('getIO should throw if not initialized', () => {
    expect(() => getIO()).toThrow();
  });

  it('initSocket should create server and register handlers', () => {
    const io = initSocket({});

    expect(ServerMock).toHaveBeenCalled();
    expect(useMock).toHaveBeenCalled();
    expect(onMock).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(getIO()).toBe(io);
  });
});
