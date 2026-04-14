import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { User, Notifikasi, Transaksi, Buku } = db;

let io;

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId || decoded.id);
    if (!user) return next(new Error('User not found'));

    if (user.status !== 'active') {
      return next(new Error('User account not active'));
    }

    socket.user = user;
    return next();
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
}

async function handleConnection(socket) {
  const user = socket.user;

  if (user.role === 'admin') {
    socket.join('admin');

    const pendingPeminjaman = await Transaksi.count({
      where: { status: 'pending' },
    });
    const pendingPengembalian = await Transaksi.count({
      where: { status: 'return_pending' },
    });
    const pendingPerpanjangan = await Transaksi.count({
      where: { status: 'extension_pending' },
    });

    socket.emit('pending:count', {
      peminjaman: pendingPeminjaman,
      pengembalian: pendingPengembalian,
      perpanjangan: pendingPerpanjangan,
      total: pendingPeminjaman + pendingPengembalian + pendingPerpanjangan,
    });
  } else {
    socket.join(`user:${user.id}`);

    // Send current admin duty status to user on connect
    const adminOnDutyCount = await User.count({
      where: { role: 'admin', is_on_duty: true, status: 'active' },
    });
    socket.emit('admin:duty_status_init', {
      is_on_duty: adminOnDutyCount > 0,
    });

    const unreadNotifications = await Notifikasi.findAll({
      where: { user_id: user.id, is_read: false },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    socket.emit('notifications:unread', {
      notifications: unreadNotifications,
      count: unreadNotifications.length,
    });

    const pendingTransactions = await Transaksi.findAll({
      where: {
        user_id: user.id,
        status: { [db.Sequelize.Op.in]: ['pending', 'return_pending', 'extension_pending'] },
      },
      include: [{ model: Buku, as: 'buku' }],
    });

    socket.emit('transactions:pending', pendingTransactions);
  }

  socket.on('notification:read', async (notificationId) => {
    await Notifikasi.update(
      { is_read: true },
      { where: { id: notificationId, user_id: user.id } }
    );
    socket.emit('notification:read:success', notificationId);
  });

  socket.on('notifications:read_all', async () => {
    await Notifikasi.update(
      { is_read: true },
      { where: { user_id: user.id, is_read: false } }
    );
    socket.emit('notifications:read_all:success');
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(authenticateSocket);
  io.on('connection', handleConnection);

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
