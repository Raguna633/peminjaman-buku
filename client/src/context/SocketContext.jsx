import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({
    peminjaman: 0,
    pengembalian: 0,
    perpanjangan: 0,
    total: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminOnDuty, setAdminOnDuty] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("🔌 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("🔌 Socket connection error:", err.message);
    });

    // === Admin events ===
    socket.on("pending:count", (data) => {
      setPendingCounts({
        peminjaman: data.peminjaman || 0,
        pengembalian: data.pengembalian || 0,
        perpanjangan: data.perpanjangan || 0,
        total: data.total || 0,
      });
    });

    socket.on("pending:count:update", (data) => {
      setPendingCounts((prev) => {
        const updated = { ...prev };
        if (data.peminjaman !== undefined) updated.peminjaman = data.peminjaman;
        if (data.pengembalian !== undefined) updated.pengembalian = data.pengembalian;
        if (data.perpanjangan !== undefined) updated.perpanjangan = data.perpanjangan;
        updated.total = updated.peminjaman + updated.pengembalian + updated.perpanjangan;
        return updated;
      });
    });

    // === User events ===
    socket.on("notifications:unread", (data) => {
      setUnreadNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
    });

    socket.on("notification:read:success", (notificationId) => {
      setUnreadNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on("notifications:read_all:success", () => {
      setUnreadNotifications([]);
      setUnreadCount(0);
    });

    // === Transaction events ===
    const transactionEvents = [
      "peminjaman:request",
      "peminjaman:approved",
      "peminjaman:rejected",
      "pengembalian:request",
      "pengembalian:approved",
      "pengembalian:rejected",
      "perpanjangan:request",
      "perpanjangan:approved",
      "perpanjangan:rejected",
      "denda:preview",
      "denda:payment_result",
    ];

    transactionEvents.forEach((event) => {
      socket.on(event, (data) => {
        // Notify registered listeners
        const callbacks = listenersRef.current.get(event);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      });
    });

    // === Admin duty status ===
    socket.on("admin:duty_status_init", (data) => {
      setAdminOnDuty(data.is_on_duty);
    });

    socket.on("admin:duty_status", (data) => {
      setAdminOnDuty(data.is_on_duty);
      const callbacks = listenersRef.current.get("admin:duty_status");
      if (callbacks) {
        callbacks.forEach((cb) => cb(data));
      }
    });

    // === Notification push ===
    socket.on("notification", (data) => {
      setUnreadNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      const callbacks = listenersRef.current.get("notification");
      if (callbacks) {
        callbacks.forEach((cb) => cb(data));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  // Register event listener
  const on = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    // Return cleanup function
    return () => {
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId) => {
    socketRef.current?.emit("notification:read", notificationId);
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    socketRef.current?.emit("notifications:read_all");
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    pendingCounts,
    unreadNotifications,
    unreadCount,
    adminOnDuty,
    on,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
