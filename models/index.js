const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar todos los modelos con nombres consistentes

db.User = require('./user')(sequelize, DataTypes);          // Corregido: './User' → './user'
db.Tienda = require('./tienda')(sequelize, DataTypes);
db.Producto = require('./producto')(sequelize, DataTypes);
db.Pedido = require('./pedido')(sequelize, DataTypes);
db.DetallePedido = require('./detallePedido')(sequelize, DataTypes);
db.Factura = require('./factura')(sequelize, DataTypes);
db.Estado = require('./estado')(sequelize, DataTypes);
db.Vehiculo = require('./Vehiculo')(sequelize, DataTypes);

// Asociaciones (después de importar todos los modelos)
// Verifica que cada modelo exporte su método associate
if (db.User.associate) db.User.associate(db);
if (db.Tienda.associate) db.Tienda.associate(db);
if (db.Producto.associate) db.Producto.associate(db);
if (db.Pedido.associate) db.Pedido.associate(db);
if (db.DetallePedido.associate) db.DetallePedido.associate(db);
if (db.Factura.associate) db.Factura.associate(db);
if (db.Estado.associate) db.Estado.associate(db);
if (db.Vehiculo.associate) db.Vehiculo.associate(db);

module.exports = db;
