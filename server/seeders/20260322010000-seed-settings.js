/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // Reset tabel agar ID mulai dari 1
  await queryInterface.bulkDelete('Settings', null, {});
  await queryInterface.sequelize.query('ALTER TABLE Settings AUTO_INCREMENT = 1');

  await queryInterface.bulkInsert('Settings', [
    {
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
      excluded_denda_dates: JSON.stringify([]),
      reminder_days_before_due: 2,
      shelf_locations: JSON.stringify(["Rak A1", "Rak A2", "Rak B1", "Rak B2"]),
      kelas_list: JSON.stringify(["X PPLG 1", "X PPLG 2", "X PPLG 3", "X APL 1", "X APL 2", "X APL 3", "X MPLB 1", "X MPLB 2", "X MPLB 3","XI PPLG 1", "XI PPLG 2", "XI PPLG 3", "XI APL 1", "XI APL 2", "XI APL 3", "XI MPLB 1", "XI MPLB 2", "XI MPLB 3", ,"XII PPLG 1", "XII PPLG 2", "XII PPLG 3", "XII APL 1", "XII APL 2", "XII APL 3", "XII MPLB 1", "XII MPLB 2", "XII MPLB 3",]),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('Settings', null, {});
}
