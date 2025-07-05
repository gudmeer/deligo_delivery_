// models/pedido.js
module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define('Pedido', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    repartidor_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tienda_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    estado_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre_cliente: DataTypes.STRING,
    telefono_cliente: DataTypes.STRING,
    correo_cliente: DataTypes.STRING,
    direccion_entrega: DataTypes.STRING
  }, {
    tableName: 'pedidos',
    underscored: true,
    timestamps: true
  });

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.User, { as: 'cliente', foreignKey: 'cliente_id' });
    Pedido.belongsTo(models.User, { as: 'repartidor', foreignKey: 'repartidor_id' });
    Pedido.belongsTo(models.Tienda, { as: 'tienda', foreignKey: 'tienda_id' });
    Pedido.belongsTo(models.Estado, { as: 'estado', foreignKey: 'estado_id' });

    Pedido.hasMany(models.DetallePedido, { as: 'detallePedidos', foreignKey: 'pedido_id' });

    Pedido.belongsToMany(models.Producto, {
      through: models.DetallePedido,
      as: 'productos',
      foreignKey: 'pedido_id',
      otherKey: 'producto_id'
    });

    Pedido.hasOne(models.Factura, { as: 'factura', foreignKey: 'pedido_id' });
  };

  return Pedido;
};
