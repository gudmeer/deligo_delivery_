// config/db.js
const { Sequelize } = require('sequelize'); // ✅ esta línea importa Sequelize correctamente
const sequelize = new Sequelize(
  
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || process.env.DB_PASS // <-- aquí el cambio
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

module.exports = {
  connectDB,
  sequelize
};
