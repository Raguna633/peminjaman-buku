import NotifikasiService from '../services/NotifikasiService.js';

/**
 * Helper to push unread notifications list to a specific user via Socket.IO
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {number|string} userId - ID of the user to receive the update
 * @param {number|string} [transaksiId] - Optional transaction ID context
 */
export const pushNotificationToUser = async (io, userId, transaksiId) => {
  try {
    const { data, count } = await NotifikasiService.getUnread(userId);
    
    // Broadcast to user-specific room
    io.to(`user:${userId}`).emit('notifications:unread', {
      notifications: data,
      count: count,
      context: transaksiId ? { type: 'transaksi', id: transaksiId } : null
    });
    
  } catch (err) {
    console.error(`[pushNotificationToUser] Error for user ${userId}:`, err);
  }
};
