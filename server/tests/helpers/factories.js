export function createMockUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    nama_lengkap: 'Test User',
    class: 'XII-A',
    nis: '12345',
    phone: '08123456789',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    password: '$2a$10$hashedpassword',
    foto: null,
    is_on_duty: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    toJSON() { return { ...this }; },
    ...overrides,
  };
}

export function createMockAdmin(overrides = {}) {
  return createMockUser({
    id: 100,
    username: 'admin1',
    nama_lengkap: 'Admin Satu',
    role: 'admin',
    is_on_duty: true,
    nis: null,
    ...overrides,
  });
}

export function createMockKategori(overrides = {}) {
  return {
    id: 1,
    nama: 'Fiksi',
    deskripsi: 'Buku fiksi',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    update: vi.fn().mockResolvedValue(true),
    destroy: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function createMockBuku(overrides = {}) {
  return {
    id: 1,
    judul: 'Buku Test',
    pengarang: 'Penulis Test',
    penerbit: 'Penerbit Test',
    tahun_terbit: 2024,
    isbn: '978-0-123456-78-9',
    kategori_id: 1,
    stok: 5,
    kondisi: 'banyak_baik',
    lokasi: 'Rak A1',
    deskripsi: 'Deskripsi buku test',
    sampul: 'cover.jpg',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    update: vi.fn().mockResolvedValue(true),
    destroy: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function createMockTransaksi(overrides = {}) {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 7);

  return {
    id: 1,
    user_id: 1,
    buku_id: 1,
    status: 'pending',
    tanggal_pinjam: null,
    tanggal_jatuh_tempo: null,
    tanggal_kembali: null,
    kondisi_buku: null,
    extension_count: 0,
    denda: 0,
    denda_dibayar: 0,
    rejection_reason: null,
    petugas_id: null,
    created_at: now,
    updated_at: now,
    buku: createMockBuku(),
    user: createMockUser(),
    update: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function createMockSettings(overrides = {}) {
  return {
    id: 1,
    max_borrow_limit: 3,
    borrow_duration_days: 7,
    allow_extension: true,
    max_extensions: 1,
    max_denda_amount: 50000,
    denda_type: 'per_day',
    denda_per_day_amount: 1000,
    denda_flat_amount: 5000,
    denda_kerusakan_ringan: 5000,
    denda_kerusakan_sedang: 10000,
    denda_kerusakan_parah: 15000,
    denda_hilang: 50000,
    excluded_denda_dates: [],
    reminder_days_before_due: 2,
    kelas_list: ['X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A', 'XII-B'],
    get(opts) {
      if (opts?.plain) {
        const { get, ...rest } = this;
        return rest;
      }
      return this;
    },
    ...overrides,
  };
}

export function createMockNotifikasi(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    title: 'Test Notification',
    message: 'Test message',
    type: 'info',
    transaksi_id: null,
    is_read: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}
