/**
 * Notifikasi seed — notifikasi sesuai alur transaksi historis dan aktif.
 *
 * @type {import('sequelize-cli').Migration}
 */
export async function up(queryInterface) {
  // Reset notifikasi
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.bulkDelete('Notifikasi', null, {});
  await queryInterface.sequelize.query('ALTER TABLE Notifikasi AUTO_INCREMENT = 1');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

  // Fetch data to construct accurate notification messages
  const [users] = await queryInterface.sequelize.query('SELECT * FROM Users');
  const [books] = await queryInterface.sequelize.query('SELECT * FROM Buku');
  const [transactions] = await queryInterface.sequelize.query('SELECT * FROM Transaksi');

  const userMap = {}; users.forEach(u => userMap[u.id] = u);
  const bookMap = {}; books.forEach(b => bookMap[b.id] = b);

  const notifications = [];

  // 1. Generate Historical Notifications
  for (const t of transactions) {
    if (t.id < 10000) { // Historical generated transactions
      const bookTitle = bookMap[t.buku_id]?.judul || 'Buku';
      
      if (t.status === 'returned') {
         // Approved notification
         notifications.push({
             user_id: t.user_id,
             title: 'Peminjaman Disetujui',
             message: `Peminjaman buku "${bookTitle}" telah disetujui. Silakan ambil buku di perpustakaan.`,
             type: 'peminjaman_approved',
             transaksi_id: t.id,
             is_read: true,
             created_at: new Date(t.tanggal_pinjam),
             updated_at: new Date(t.tanggal_pinjam)
         });
         
         // Returned notification
         let returnMessage = `Buku "${bookTitle}" berhasil dikembalikan. Terima kasih!`;
         if (t.kondisi_buku !== 'baik') {
             const dendaFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.denda);
             returnMessage = `Buku "${bookTitle}" dikembalikan dengan kondisi ${t.kondisi_buku.replace('_', ' ')}. Denda: ${dendaFmt}.`;
         }
         
         notifications.push({
             user_id: t.user_id,
             title: 'Pengembalian Diterima',
             message: returnMessage,
             type: 'pengembalian_approved',
             transaksi_id: t.id,
             is_read: true,
             created_at: new Date(t.tanggal_kembali),
             updated_at: new Date(t.tanggal_kembali)
         });
         
      } else if (t.status === 'rejected') {
         notifications.push({
             user_id: t.user_id,
             title: 'Peminjaman Ditolak',
             message: `Peminjaman buku "${bookTitle}" ditolak. Alasan: ${t.rejection_reason || 'Tidak memenuhi syarat.'}`,
             type: 'peminjaman_rejected',
             transaksi_id: t.id,
             is_read: true,
             created_at: new Date(t.updated_at),
             updated_at: new Date(t.updated_at)
         });
      } else if (t.status === 'lost') {
         // Approved initially
         notifications.push({
             user_id: t.user_id,
             title: 'Peminjaman Disetujui',
             message: `Peminjaman buku "${bookTitle}" telah disetujui. Silakan ambil buku di perpustakaan.`,
             type: 'peminjaman_approved',
             transaksi_id: t.id,
             is_read: true,
             created_at: new Date(t.tanggal_pinjam),
             updated_at: new Date(t.tanggal_pinjam)
         });
         // Lost notification
         notifications.push({
             user_id: t.user_id,
             title: 'Buku Dinyatakan Hilang',
             message: `Buku "${bookTitle}" dinyatakan hilang. Denda sebesar Rp50.000 dikenakan.`,
             type: 'buku_hilang',
             transaksi_id: t.id,
             is_read: true,
             created_at: new Date(t.updated_at),
             updated_at: new Date(t.updated_at)
         });
      }
    }
  }

  // 2. Active Edge Cases Notifications (Mapping exactly to current active ones)
  const manualNotifications = [
    // ── Notifikasi untuk Admin (peminjaman request masuk) ──
    {
      user_id: 1, // admin1
      title: 'Permintaan Peminjaman Baru',
      message: 'Ahmad Rizky Pratama mengajukan peminjaman buku "Laskar Pelangi".',
      type: 'peminjaman_request',
      transaksi_id: 10001,
      is_read: false,
      created_at: now,
      updated_at: now,
    },
    {
      user_id: 1,
      title: 'Permintaan Peminjaman Baru',
      message: 'Dewi Anggraeni mengajukan peminjaman buku "Sapiens".',
      type: 'peminjaman_request',
      transaksi_id: 10002,
      is_read: false,
      created_at: now,
      updated_at: now,
    },

    // ── Notifikasi siswa1: peminjaman di-approve ──
    {
      user_id: 3, // siswa1
      title: 'Peminjaman Disetujui',
      message: 'Peminjaman buku "Clean Code" telah disetujui. Silakan ambil buku di perpustakaan.',
      type: 'peminjaman_approved',
      transaksi_id: 10003,
      is_read: true,
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
    {
      user_id: 3,
      title: 'Peminjaman Disetujui',
      message: 'Peminjaman buku "The Pragmatic Programmer" telah disetujui.',
      type: 'peminjaman_approved',
      transaksi_id: 10014,
      is_read: true,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },

    // ── Notifikasi siswa4: ditolak ──
    {
      user_id: 6, // siswa4
      title: 'Peminjaman Ditolak',
      message: 'Peminjaman buku "Perahu Kertas" ditolak. Alasan: Stok buku tidak tersedia saat ini.',
      type: 'peminjaman_rejected',
      transaksi_id: 10005,
      is_read: true,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },

    // ── Notifikasi admin: request pengembalian ──
    {
      user_id: 1,
      title: 'Permintaan Pengembalian',
      message: 'Ahmad Rizky Pratama mengajukan pengembalian buku "Filosofi Teras".',
      type: 'pengembalian_request',
      transaksi_id: 10006,
      is_read: false,
      created_at: now,
      updated_at: now,
    },

    // ── Notifikasi admin: request perpanjangan ──
    {
      user_id: 1,
      title: 'Permintaan Perpanjangan',
      message: 'Dewi Anggraeni mengajukan perpanjangan buku "A Brief History of Time".',
      type: 'perpanjangan_request',
      transaksi_id: 10007,
      is_read: false,
      created_at: now,
      updated_at: now,
    },

    // ── Notifikasi siswa3: overdue warning ──
    {
      user_id: 5, // siswa3
      title: 'Peringatan Keterlambatan',
      message: 'Buku "Sejarah Indonesia Modern" sudah melewati batas waktu pengembalian. Segera kembalikan untuk menghindari denda.',
      type: 'overdue_warning',
      transaksi_id: 10011,
      is_read: false,
      created_at: daysAgo(7),
      updated_at: daysAgo(7),
    },
    {
      user_id: 5,
      title: 'Peringatan Keterlambatan',
      message: 'Buku "Clean Code" sudah melewati batas waktu pengembalian. Denda berjalan.',
      type: 'overdue_warning',
      transaksi_id: 10012,
      is_read: false,
      created_at: daysAgo(7),
      updated_at: daysAgo(7),
    },

    // ── Notifikasi siswa5: buku hilang ──
    {
      user_id: 7, // siswa5
      title: 'Buku Dinyatakan Hilang',
      message: 'Buku "Nusantara: Sejarah Indonesia" dinyatakan hilang. Denda sebesar Rp50.000 dikenakan.',
      type: 'buku_hilang',
      transaksi_id: 10013,
      is_read: false,
      created_at: daysAgo(10),
      updated_at: daysAgo(10),
    },

    // ── Notifikasi siswa4: pengembalian berhasil ──
    {
      user_id: 6,
      title: 'Pengembalian Diterima',
      message: 'Buku "Laskar Pelangi" berhasil dikembalikan. Terima kasih!',
      type: 'pengembalian_approved',
      transaksi_id: 10008,
      is_read: true,
      created_at: daysAgo(6),
      updated_at: daysAgo(6),
    },
    {
      user_id: 6,
      title: 'Pengembalian Diterima',
      message: 'Buku "The Pragmatic Programmer" dikembalikan dengan kondisi rusak ringan. Denda: Rp8.000.',
      type: 'pengembalian_approved',
      transaksi_id: 10009,
      is_read: true,
      created_at: daysAgo(10),
      updated_at: daysAgo(10),
    },

    // ── Notifikasi siswa2: reminder jatuh tempo ──
    {
      user_id: 4, // siswa2
      title: 'Pengingat Jatuh Tempo',
      message: 'Buku "Belajar JavaScript Modern" akan jatuh tempo dalam 2 hari. Pastikan dikembalikan tepat waktu.',
      type: 'due_reminder',
      transaksi_id: 10004,
      is_read: false,
      created_at: now,
      updated_at: now,
    },
  ];

  notifications.push(...manualNotifications);

  // Chunk insert to avoid "Packet too large" if lots of historical notifications
  while (notifications.length > 0) {
    const chunk = notifications.splice(0, 500);
    await queryInterface.bulkInsert('Notifikasi', chunk);
  }
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Notifikasi', null, {});
}
