/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;
  await queryInterface.createTable('Users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    username: {
      type: DataTypes.STRING
    },
    nama_lengkap: {
      type: DataTypes.STRING
    },
    class: {
      type: DataTypes.STRING
    },
    nis: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    foto: {
      type: DataTypes.STRING
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
  await queryInterface.dropTable('Users');
}
