/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  await queryInterface.createTable('Buku', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    judul: {
      type: DataTypes.STRING,
    },
    pengarang: {
      type: DataTypes.STRING,
    },
    penerbit: {
      type: DataTypes.STRING,
    },
    tahun_terbit: {
      type: DataTypes.INTEGER,
    },
    isbn: {
      type: DataTypes.STRING,
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stok: {
      type: DataTypes.INTEGER,
    },
    kondisi: {
      type: DataTypes.STRING,
    },
    lokasi: {
      type: DataTypes.STRING,
    },
    deskripsi: {
      type: DataTypes.TEXT,
    },
    sampul: {
      type: DataTypes.STRING,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Buku');
}
