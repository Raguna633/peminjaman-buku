/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;
  await queryInterface.createTable('Settings', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    max_borrow_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    borrow_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    allow_extension: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    max_extensions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    denda_type: {
      type: DataTypes.ENUM('flat', 'per_day'),
      allowNull: false,
      defaultValue: 'per_day',
    },
    denda_per_day_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    denda_flat_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
    },
    damage_fine_ringan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
    },
    damage_fine_sedang: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10000,
    },
    damage_fine_parah: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15000,
    },
    lost_book_fine: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50000,
    },
    excluded_fine_dates: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of dates in YYYY-MM-DD format',
    },
    reminder_days_before_due: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE
    }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('Settings');
}
