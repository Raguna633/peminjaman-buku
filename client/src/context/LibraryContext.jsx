import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const LibraryContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({ baseURL: `${API_BASE}/api` });

export const getCoverUrl = (sampul) => {
  if (!sampul) return null;
  if (sampul.startsWith("http")) return sampul;
  return `${API_BASE}/public/uploads/covers/${sampul}`;
};

export const getPhotoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith("http")) return foto;
  return `${API_BASE}/public/uploads/users/${foto}`;
};

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const LibraryProvider = ({ children }) => {
  const { user: authUser } = useAuth();
  const { on } = useSocket();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== FETCH FUNCTIONS =====
  const fetchBooks = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/buku", { params });
      // Only update global books if we're not doing a specific paginated/search query
      if (!params.limit && !params.search && !params.kategori) {
        setBooks(res.data.data || []);
      }
      return res.data;
    } catch (err) {
      console.error("Error fetching books:", err);
      return { success: false, data: [], totalItems: 0 };
    }
  }, []);

  const fetchCategories = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/kategori", { params });
      if (!params.limit && !params.search) {
        setCategories(res.data.data || []);
      }
      return res.data;
    } catch (err) {
      console.error("Error fetching categories:", err);
      return { success: false, data: [], totalItems: 0 };
    }
  }, []);

  const fetchMembers = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/user", { params });
      const allUsers = res.data.data || [];
      // Only update global members if not paginated/filtered
      if (!params.limit && !params.search && !params.role && !params.status && !params.class) {
        setMembers(allUsers.filter((u) => u.role === "user"));
      }
      return res.data;
    } catch (err) {
      console.error("Error fetching members:", err);
      return { success: false, data: [], totalItems: 0 };
    }
  }, []);

  const fetchTransactions = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/transaksi", { params });
      if (!params.limit && !params.status && !params.user_id && !params.search) {
        setTransactions(res.data.data || []);
      }
      return res.data;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      return { success: false, data: [], totalItems: 0 };
    }
  }, []);

  const fetchUserTransactions = useCallback(async (params = {}) => {
    try {
      const res = await api.get("/transaksi/user", { params });
      if (!params.limit && !params.status) {
        setTransactions(res.data.data || []);
      }
      return res.data;
    } catch (err) {
      console.error("Error fetching user transactions:", err);
      return { success: false, data: [], totalItems: 0 };
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data.data || null);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  }, []);

  // Initial data load — role-aware
  useEffect(() => {
    if (!authUser) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const promises = [fetchBooks(), fetchCategories(), fetchSettings()];
        if (authUser.role === "admin") {
          promises.push(fetchMembers(), fetchTransactions());
        } else {
          promises.push(fetchUserTransactions());
        }
        await Promise.all(promises);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [authUser, fetchBooks, fetchCategories, fetchMembers, fetchTransactions, fetchUserTransactions, fetchSettings]);

  // Real-time synchronization
  useEffect(() => {
    if (!authUser || !on) return;

    const refreshData = () => {
      fetchBooks();
      if (authUser.role === "admin") {
        fetchTransactions();
      } else {
        fetchUserTransactions();
      }
    };

    const eventsToListen = [
      "peminjaman:request",
      "peminjaman:approved",
      "peminjaman:rejected",
      "pengembalian:request",
      "pengembalian:approved",
      "pengembalian:rejected",
      "perpanjangan:request",
      "perpanjangan:approved",
      "perpanjangan:rejected",
      "denda:payment_result"
    ];

    const unsubs = eventsToListen.map(event => on(event, refreshData));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [authUser, on, fetchBooks, fetchTransactions, fetchUserTransactions]);

  // ===== BOOK OPERATIONS =====
  const addBook = async (bookData) => {
    try {
      const res = await api.post("/buku", bookData);
      await fetchBooks();
      return { success: true, book: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menambahkan buku";
      return { success: false, message: msg };
    }
  };

  const updateBook = async (bookId, bookData) => {
    try {
      await api.put(`/buku/${bookId}`, bookData);
      await fetchBooks();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengupdate buku";
      return { success: false, message: msg };
    }
  };

  const deleteBook = async (bookId) => {
    try {
      await api.delete(`/buku/${bookId}`);
      await fetchBooks();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus buku";
      return { success: false, message: msg };
    }
  };

  const getBookById = (bookId) => {
    return books.find((book) => book.id === bookId);
  };

  const searchBooks = (query) => {
    const q = query.toLowerCase();
    return books.filter(
      (book) =>
        book.judul?.toLowerCase().includes(q) ||
        book.pengarang?.toLowerCase().includes(q) ||
        book.kategori?.nama?.toLowerCase().includes(q)
    );
  };

  const getAvailableBooks = () => {
    return books.filter((book) => book.stok > 0);
  };

  // ===== CATEGORY OPERATIONS =====
  const addCategory = async (categoryData) => {
    try {
      const res = await api.post("/kategori", categoryData);
      await fetchCategories();
      return { success: true, category: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menambahkan kategori";
      return { success: false, message: msg };
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    try {
      await api.put(`/kategori/${categoryId}`, categoryData);
      await fetchCategories();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengupdate kategori";
      return { success: false, message: msg };
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      await api.delete(`/kategori/${categoryId}`);
      await fetchCategories();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus kategori";
      return { success: false, message: msg };
    }
  };

  // ===== MEMBER OPERATIONS =====
  const addMember = async (memberData) => {
    try {
      const res = await api.post("/user", memberData);
      await fetchMembers();
      return { success: true, member: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menambahkan anggota";
      return { success: false, message: msg };
    }
  };

  const updateMember = async (memberId, memberData) => {
    try {
      await api.put(`/user/${memberId}`, memberData);
      await fetchMembers();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengupdate anggota";
      return { success: false, message: msg };
    }
  };

  const deleteMember = async (memberId) => {
    try {
      await api.delete(`/user/${memberId}`);
      await fetchMembers();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus anggota";
      return { success: false, message: msg };
    }
  };

  const bulkAddMembers = async (membersData) => {
    try {
      const res = await api.post("/user/bulk", { users: membersData });
      await fetchMembers();
      return { 
        success: true, 
        message: res.data.message,
        importedCount: res.data.importedCount,
        errors: res.data.errors 
      };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengimpor anggota";
      return { success: false, message: msg, errors: err.response?.data?.errors };
    }
  };

  const getMemberById = (memberId) => {
    return members.find((member) => member.id === memberId);
  };

  const searchMembers = (query) => {
    const q = query.toLowerCase();
    return members.filter(
      (member) =>
        member.nama_lengkap?.toLowerCase().includes(q) ||
        (member.nis && member.nis.includes(query)) ||
        (member.email && member.email.toLowerCase().includes(q))
    );
  };

  // ===== TRANSACTION OPERATIONS (Request-based flow) =====
  const requestPeminjaman = async (bukuId) => {
    try {
      const res = await api.post("/transaksi/request-peminjaman", {
        buku_id: bukuId,
      });
      await Promise.all([fetchBooks(), fetchTransactions(), fetchUserTransactions()]);
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal request peminjaman";
      return { success: false, message: msg };
    }
  };

  const requestPengembalian = async (transaksiId) => {
    try {
      const res = await api.post("/transaksi/request-pengembalian", {
        transaksi_id: transaksiId,
      });
      await Promise.all([fetchTransactions(), fetchUserTransactions()]);
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal request pengembalian";
      return { success: false, message: msg };
    }
  };

  const requestPerpanjangan = async (transaksiId) => {
    try {
      const res = await api.post(`/transaksi/${transaksiId}/request-perpanjangan`);
      await Promise.all([fetchTransactions(), fetchUserTransactions()]);
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal request perpanjangan";
      return { success: false, message: msg };
    }
  };

  // Admin approve/reject actions
  const approvePeminjaman = async (transaksiId) => {
    try {
      await api.put(`/transaksi/${transaksiId}/approve-peminjaman`);
      await Promise.all([fetchBooks(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal approve peminjaman";
      return { success: false, message: msg };
    }
  };

  const rejectPeminjaman = async (transaksiId, reason) => {
    try {
      await api.put(`/transaksi/${transaksiId}/reject-peminjaman`, {
        rejection_reason: reason,
      });
      await fetchTransactions();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal reject peminjaman";
      return { success: false, message: msg };
    }
  };

  const approvePengembalian = async (transaksiId, kondisiBuku, excludedDatesOverride = []) => {
    try {
      await api.put(`/transaksi/${transaksiId}/approve-pengembalian`, {
        kondisi_buku: kondisiBuku,
        excluded_dates: excludedDatesOverride,
      });
      await Promise.all([fetchBooks(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal approve pengembalian";
      return { success: false, message: msg };
    }
  };

  const calculateFinePreview = async (transaksiId, kondisiBuku, excludedDatesOverride = []) => {
    try {
      const res = await api.post(`/transaksi/${transaksiId}/kalkulasi-denda`, {
        kondisi_buku: kondisiBuku,
        excluded_dates: excludedDatesOverride,
      });
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal kalkulasi denda";
      return { success: false, message: msg };
    }
  };

  const processPayment = async (transaksiId, amount) => {
    try {
      const res = await api.post(`/transaksi/${transaksiId}/bayar-denda`, {
        jumlah_bayar: Number(amount) || 0,
      });
      await fetchTransactions(); // Refresh transactions to see payment applied
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal memproses pembayaran";
      return { success: false, message: msg };
    }
  };

  const bulkProcessPayment = async (transaksiIds, amount, userId) => {
    try {
      const res = await api.post(`/transaksi/bulk-bayar-denda`, {
        transaksi_ids: transaksiIds,
        jumlah_bayar: Number(amount) || 0,
        user_id: userId,
      });
      await fetchTransactions();
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal memproses pembayaran batch";
      return { success: false, message: msg };
    }
  };

  const rejectPengembalian = async (transaksiId, reason) => {
    try {
      await api.put(`/transaksi/${transaksiId}/reject-pengembalian`, {
        rejection_reason: reason,
      });
      await fetchTransactions();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal reject pengembalian";
      return { success: false, message: msg };
    }
  };

  const approvePerpanjangan = async (transaksiId) => {
    try {
      const res = await api.put(`/transaksi/${transaksiId}/approve-perpanjangan`);
      await fetchTransactions();
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal approve perpanjangan";
      return { success: false, message: msg };
    }
  };

  const rejectPerpanjangan = async (transaksiId, reason) => {
    try {
      await api.put(`/transaksi/${transaksiId}/reject-perpanjangan`, {
        rejection_reason: reason,
      });
      await fetchTransactions();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal reject perpanjangan";
      return { success: false, message: msg };
    }
  };

  const bulkApprovePeminjaman = async (transaksiIds) => {
    try {
      const res = await api.post("/transaksi/bulk-approve-peminjaman", {
        transaksi_ids: transaksiIds,
      });
      await Promise.all([fetchBooks(), fetchTransactions()]);
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal bulk approve";
      return { success: false, message: msg };
    }
  };

  const returnLost = async (transaksiId, kondisiBuku) => {
    try {
      await api.put(`/transaksi/${transaksiId}/return-lost`, {
        kondisi_buku: kondisiBuku,
      });
      await Promise.all([fetchBooks(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengembalikan buku hilang";
      return { success: false, message: msg };
    }
  };

  // ===== SETTINGS OPERATIONS =====
  const updateSettings = async (settingsData) => {
    try {
      const res = await api.put("/settings", settingsData);
      setSettings(res.data.data || null);
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal update settings";
      return { success: false, message: msg };
    }
  };

  // ===== DUTY STATUS =====
  const toggleDutyStatus = async () => {
    try {
      const res = await api.put("/auth/duty-status");
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengubah status berjaga";
      return { success: false, message: msg };
    }
  };

  const checkAdminDuty = async () => {
    try {
      const res = await api.get("/auth/check-duty");
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: "Gagal cek status admin" };
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getTransactionsByUser = (userId) => {
    return transactions.filter((t) => t.user_id === userId);
  };

  const getActiveTransactionsByUser = (userId) => {
    const activeStatuses = ["pending", "approved", "overdue", "return_pending", "extension_pending"];
    return transactions.filter(
      (t) => t.user_id === userId && activeStatuses.includes(t.status)
    );
  };

  const getAllActiveTransactions = () => {
    const activeStatuses = ["pending", "approved", "overdue", "return_pending", "extension_pending"];
    return transactions.filter((t) => activeStatuses.includes(t.status));
  };

  // ===== STATISTICS =====
  const getStatistics = () => {
    const totalBooks = books.reduce((acc, book) => acc + (book.stok || 0), 0);
    const totalMembers = members.length;
    const activeTransactions = getAllActiveTransactions().length;
    const totalTransactions = transactions.length;
    const totalFines = transactions.reduce((acc, t) => acc + (t.denda || 0), 0);

    return {
      totalBooks,
      borrowedBooks: activeTransactions,
      availableBooks: totalBooks - activeTransactions,
      totalMembers,
      activeTransactions,
      totalTransactions,
      totalFines,
    };
  };

  // ===== REFRESH HELPERS =====
  const refreshAll = async () => {
    await Promise.all([
      fetchBooks(),
      fetchCategories(),
      fetchMembers(),
      fetchTransactions(),
    ]);
  };

  const value = {
    // Data
    books,
    members,
    transactions,
    categories,
    settings,
    loading,
    // Book operations
    addBook,
    updateBook,
    deleteBook,
    getBookById,
    searchBooks,
    getAvailableBooks,
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    // Member operations
    addMember,
    updateMember,
    deleteMember,
    bulkAddMembers,
    getMemberById,
    searchMembers,
    // Transaction operations (request-based flow)
    requestPeminjaman,
    requestPengembalian,
    requestPerpanjangan,
    approvePeminjaman,
    rejectPeminjaman,
    approvePengembalian,
    rejectPengembalian,
    approvePerpanjangan,
    rejectPerpanjangan,
    bulkApprovePeminjaman,
    returnLost,
    calculateFinePreview,
    processPayment,
    bulkProcessPayment,
    // Transaction helpers
    getTransactionsByUser,
    getActiveTransactionsByUser,
    getAllActiveTransactions,
    // Settings
    fetchSettings,
    updateSettings,
    // Duty status
    toggleDutyStatus,
    checkAdminDuty,
    // Statistics
    getStatistics,
    // Refresh
    refreshAll,
    fetchBooks,
    fetchCategories,
    fetchMembers,
    fetchTransactions,
    fetchUserTransactions,
  };

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};
