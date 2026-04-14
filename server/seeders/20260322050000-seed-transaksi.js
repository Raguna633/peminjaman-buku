/**
 * Transaksi seed — mencakup historical 1 year data + 15 status edge case.
 *
 * Referensi ID:
 *   Users  : 1=admin1, 2=admin2, 3=siswa1, 4=siswa2, 5=siswa3, 6=siswa4, 7=siswa5, 8=siswa6
 *   Buku   : 1..12
 *
 * @type {import('sequelize-cli').Migration}
 */
export async function up(queryInterface) {
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.bulkDelete('Transaksi', null, {});
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const daysLater = (d) => new Date(now.getTime() + d * 86400000);

  const transactions = [];

  // ==========================================
  // 1. GENERATE HISTORICAL TRANSACTIONS (1 Year)
  // ==========================================
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const generateHistoricalStatus = () => {
    const r = Math.random();
    if (r < 0.85) return 'returned';
    if (r < 0.98) return 'rejected';
    return 'lost';
  };

  const generateKondisiBuku = () => {
    const r = Math.random();
    if (r < 0.75) return 'baik';
    if (r < 0.88) return 'rusak_ringan';
    if (r < 0.96) return 'rusak_sedang';
    return 'rusak_parah';
  };

  const [userBounds] = await queryInterface.sequelize.query('SELECT MIN(id) as minId, MAX(id) as maxId FROM Users WHERE role = "user"');
  const minUserId = userBounds[0].minId || 3;
  const maxUserId = userBounds[0].maxId || 8;

  let txIdCounter = 1;

  for (let day = 365; day >= 15; day--) {
    const numTx = getRandomInt(0, 3);
    for (let i = 0; i < numTx; i++) {
        const userId = getRandomInt(minUserId, maxUserId); 
        const bukuId = getRandomInt(1, 12); 
        const petugasId = getRandomInt(1, 2); 

        const status = generateHistoricalStatus();
        const baseDate = daysAgo(day);
        
        let tanggal_pinjam = null;
        let tanggal_jatuh_tempo = null;
        let tanggal_kembali = null;
        let kondisi_buku = null;
        let denda = 0;
        let denda_dibayar = 0;
        let rejection_reason = null;
        
        const created_at = new Date(baseDate);
        let updated_at = new Date(baseDate);
        
        if (status === 'rejected') {
            rejection_reason = getRandomElement(['Stok buku habis saat persetujuan', 'Batas peminjaman maksimal tercapai', 'Siswa masih memiliki denda aktif']);
            updated_at = new Date(baseDate.getTime() + 86400000 * 0.5);
        } else if (status === 'returned' || status === 'lost') {
            tanggal_pinjam = new Date(baseDate);
            tanggal_jatuh_tempo = new Date(baseDate.getTime() + (7 * 86400000));
            
            const returnDuration = getRandomInt(2, 12); 
            tanggal_kembali = new Date(baseDate.getTime() + (returnDuration * 86400000));
            updated_at = new Date(tanggal_kembali);
            
            if (status === 'returned') {
                kondisi_buku = generateKondisiBuku();
                const overdueDays = returnDuration - 7;
                if (overdueDays > 0) denda += overdueDays * 1000;
                
                if (kondisi_buku === 'rusak_ringan') denda += 5000;
                else if (kondisi_buku === 'rusak_sedang') denda += 10000;
                else if (kondisi_buku === 'rusak_parah') denda += 15000;
            } else {
                kondisi_buku = 'hilang';
                denda += 50000; 
            }
            denda_dibayar = denda;
        }

        transactions.push({
            id: txIdCounter++,
            user_id: userId,
            buku_id: bukuId,
            status,
            tanggal_pinjam,
            tanggal_jatuh_tempo,
            tanggal_kembali,
            kondisi_buku,
            extension_count: 0,
            denda,
            denda_dibayar,
            rejection_reason,
            petugas_id: petugasId,
            created_at,
            updated_at
        });
    }
  }

  // ==========================================
  // 2. EDGE CASES (ACTIVE TRANSACTIONS) 10001+
  // ==========================================
  const edgeCases = [
    { id: 10001, user_id: 3, buku_id: 1, status: 'pending', tanggal_pinjam: null, tanggal_jatuh_tempo: null, tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: null, created_at: now, updated_at: now },
    { id: 10002, user_id: 4, buku_id: 4, status: 'pending', tanggal_pinjam: null, tanggal_jatuh_tempo: null, tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: null, created_at: now, updated_at: now },
    { id: 10003, user_id: 3, buku_id: 8, status: 'approved', tanggal_pinjam: daysAgo(3), tanggal_jatuh_tempo: daysLater(4), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: 10004, user_id: 4, buku_id: 10, status: 'approved', tanggal_pinjam: daysAgo(5), tanggal_jatuh_tempo: daysLater(2), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: 10005, user_id: 6, buku_id: 3, status: 'rejected', tanggal_pinjam: null, tanggal_jatuh_tempo: null, tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: 'Stok buku tidak tersedia saat ini.', petugas_id: 1, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: 10006, user_id: 3, buku_id: 5, status: 'return_pending', tanggal_pinjam: daysAgo(6), tanggal_jatuh_tempo: daysLater(1), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(6), updated_at: now },
    { id: 10007, user_id: 4, buku_id: 6, status: 'extension_pending', tanggal_pinjam: daysAgo(6), tanggal_jatuh_tempo: daysLater(1), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(6), updated_at: now },
    { id: 10008, user_id: 6, buku_id: 1, status: 'returned', tanggal_pinjam: daysAgo(14), tanggal_jatuh_tempo: daysAgo(7), tanggal_kembali: daysAgo(6), kondisi_buku: 'baik', extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(14), updated_at: daysAgo(6) },
    { id: 10009, user_id: 6, buku_id: 9, status: 'returned', tanggal_pinjam: daysAgo(20), tanggal_jatuh_tempo: daysAgo(13), tanggal_kembali: daysAgo(10), kondisi_buku: 'rusak_ringan', extension_count: 0, denda: 8000, denda_dibayar: 8000, rejection_reason: null, petugas_id: 2, created_at: daysAgo(20), updated_at: daysAgo(10) },
    { id: 10010, user_id: 5, buku_id: 2, status: 'returned', tanggal_pinjam: daysAgo(25), tanggal_jatuh_tempo: daysAgo(18), tanggal_kembali: daysAgo(14), kondisi_buku: 'rusak_sedang', extension_count: 0, denda: 14000, denda_dibayar: 14000, rejection_reason: null, petugas_id: 1, created_at: daysAgo(25), updated_at: daysAgo(14) },
    { id: 10011, user_id: 5, buku_id: 11, status: 'overdue', tanggal_pinjam: daysAgo(14), tanggal_jatuh_tempo: daysAgo(7), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 7000, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(14), updated_at: now },
    { id: 10012, user_id: 5, buku_id: 8, status: 'overdue', tanggal_pinjam: daysAgo(21), tanggal_jatuh_tempo: daysAgo(7), tanggal_kembali: null, kondisi_buku: null, extension_count: 1, denda: 7000, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(21), updated_at: now },
    { id: 10013, user_id: 7, buku_id: 12, status: 'lost', tanggal_pinjam: daysAgo(30), tanggal_jatuh_tempo: daysAgo(23), tanggal_kembali: null, kondisi_buku: 'hilang', extension_count: 0, denda: 50000, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(30), updated_at: daysAgo(10) },
    { id: 10014, user_id: 3, buku_id: 9, status: 'approved', tanggal_pinjam: daysAgo(2), tanggal_jatuh_tempo: daysLater(5), tanggal_kembali: null, kondisi_buku: null, extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 1, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: 10015, user_id: 4, buku_id: 2, status: 'returned', tanggal_pinjam: daysAgo(30), tanggal_jatuh_tempo: daysAgo(23), tanggal_kembali: daysAgo(24), kondisi_buku: 'baik', extension_count: 0, denda: 0, denda_dibayar: 0, rejection_reason: null, petugas_id: 2, created_at: daysAgo(30), updated_at: daysAgo(24) },
  ];

  transactions.push(...edgeCases);

  // Split strict query sizing (MySQL limit is high but safe batches of 500 is better)
  while (transactions.length > 0) {
    const chunk = transactions.splice(0, 500);
    await queryInterface.bulkInsert('Transaksi', chunk);
  }
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Transaksi', null, {});
}
