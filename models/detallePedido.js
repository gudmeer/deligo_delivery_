// models/detalle_pedido.js
module.exports = (sequelize, DataTypes) => {
  const DetallePedido = sequelize.define('DetallePedido', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pedido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pedidos', // nombre de la tabla en BD
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos', // nombre de la tabla en BD
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precio_unitario: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    tableName: 'detalle_pedidos',
    underscored: true,
    timestamps: true
  });

  DetallePedido.associate = (models) => {
    // Relación con Pedido (muchos detalles pertenecen a un pedido)
    DetallePedido.belongsTo(models.Pedido, {
      foreignKey: 'pedido_id',
      as: 'pedido',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Relación con Producto (cada detalle es de un producto)
    DetallePedido.belongsTo(models.Producto, {
      foreignKey: 'producto_id',
      as: 'producto',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return DetallePedido;
};
