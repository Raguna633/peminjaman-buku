import { Model } from 'sequelize';

const SettingsModel = (sequelize, DataTypes) => {
  class Settings extends Model {
    static associate(_models) {
      // no associations
    }
  }
  Settings.init({
    max_borrow_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: { min: 1, max: 10 },
    },
    borrow_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      validate: { min: 1, max: 30 },
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
      validate: { min: 0, max: 5 },
    },
    max_denda_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50000,
      validate: { min: 0 },
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
      validate: { min: 0 },
    },
    denda_flat_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
      validate: { min: 0 },
    },
    denda_kerusakan_ringan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000,
    },
    denda_kerusakan_sedang: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10000,
    },
    denda_kerusakan_parah: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15000,
    },
    denda_hilang: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50000,
    },
    excluded_denda_dates: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of dates in YYYY-MM-DD format',
    },
    reminder_days_before_due: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      validate: { min: 0, max: 7 },
    },
    shelf_locations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of shelf locations',
    },
    kelas_list: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of class names',
    },
  }, {
    sequelize,
    modelName: 'Settings',
    tableName: 'Settings',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  });
  return Settings;
};

export default SettingsModel;
