// models/tienda.js
module.exports = (sequelize, DataTypes) => {
  const Tienda = sequelize.define('Tienda', {
    nombre: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'tiendas',
    timestamps: true
  });

  Tienda.associate = (models) => {
    Tienda.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'usuario' }); // 🔁 Relación agregada
    Tienda.hasMany(models.Producto, { foreignKey: 'tiendaId', as: 'productos' });
    Tienda.hasMany(models.Pedido, { foreignKey: 'tiendaId', as: 'pedidos' });
  };

  return Tienda;
};
