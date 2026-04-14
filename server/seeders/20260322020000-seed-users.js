import bcrypt from 'bcryptjs';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // Reset agar User ID mulai dari 1
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.bulkDelete('Users', null, {});
  await queryInterface.sequelize.query('ALTER TABLE Users AUTO_INCREMENT = 1');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const siswaHash = await bcrypt.hash('siswa123', salt);

  // Ambil kelas_list dari Settings
  const [settings] = await queryInterface.sequelize.query('SELECT kelas_list FROM Settings LIMIT 1');
  let kelas_list = [];
  if (settings.length > 0 && settings[0].kelas_list) {
      const parsed = typeof settings[0].kelas_list === 'string' ? JSON.parse(settings[0].kelas_list) : settings[0].kelas_list;
      // membersihkan element null karena kemungkinan koma ganda pada seeder
      kelas_list = parsed.filter(Boolean);
  } else {
      kelas_list = ["X PPLG 1"]; // fallback
  }

  const users = [
    // ── Admin ──
    {
      username: 'admin1',
      password: adminHash,
      nama_lengkap: 'Budi Santoso',
      nis: null,
      class: null,
      role: 'admin',
      status: 'active',
      email: 'admin1@perpustakaan.sch.id',
      phone: '081234567890',
      foto: null,
      is_on_duty: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      username: 'admin2',
      password: adminHash,
      nama_lengkap: 'Siti Rahayu',
      nis: null,
      class: null,
      role: 'admin',
      status: 'active',
      email: 'admin2@perpustakaan.sch.id',
      phone: '081234567891',
      foto: null,
      is_on_duty: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  let siswaIdCounter = 1;
  const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Intan', 'Joko', 'Kartika', 'Lestari', 'Maya', 'Nugroho', 'Oki', 'Putri', 'Rizky', 'Sari', 'Tirta', 'Utami', 'Vina', 'Wahyu', 'Yudi', 'Zahra'];
  const lastNames = ['Pratama', 'Santoso', 'Wulandari', 'Anggraeni', 'Kurniawan', 'Rahayu', 'Sari', 'Nugroho', 'Wijaya', 'Kusuma', 'Saputra', 'Indah'];

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  for (const kelas of kelas_list) {
      for (let i = 0; i < 20; i++) {
         const numStr = siswaIdCounter.toString().padStart(3, '0');
         const nis = `2024${numStr}`;
         const username = `siswa${siswaIdCounter}`;
         const email = `siswa${siswaIdCounter}@siswa.sch.id`;
         const phone = `0857${numStr.padStart(8, '0')}`;
         
         let status = 'active';
         if (siswaIdCounter === 6) status = 'inactive';
         
         // Nama untuk edge cases 1..6 agar notifikasi sejarah tetap valid tanpa putus relasi label
         let nama_lengkap = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
         
         if (siswaIdCounter === 1) nama_lengkap = 'Ahmad Rizky Pratama';
         if (siswaIdCounter === 2) nama_lengkap = 'Dewi Anggraeni';
         if (siswaIdCounter === 3) nama_lengkap = 'Fajar Nugroho';
         if (siswaIdCounter === 4) nama_lengkap = 'Lestari Wulandari';
         if (siswaIdCounter === 5) nama_lengkap = 'Rendi Kurniawan';
         if (siswaIdCounter === 6) nama_lengkap = 'Maya Sari';

         users.push({
             username,
             password: siswaHash,
             nama_lengkap,
             nis,
             class: kelas,
             role: 'user',
             status,
             email,
             phone,
             foto: null,
             is_on_duty: false,
             created_at: new Date(),
             updated_at: new Date()
         });
         
         siswaIdCounter++;
      }
  }

  // Split query per 500 rows
  while (users.length > 0) {
      const chunk = users.splice(0, 500);
      await queryInterface.bulkInsert('Users', chunk);
  }
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Users', null, {});
}
