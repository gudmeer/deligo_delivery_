// models/producto.js
module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: DataTypes.STRING,
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tiendaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tienda_id' 
    }
  }, {
    tableName: 'productos',
    timestamps: true,
    underscored: true
  });

  Producto.associate = (models) => {
    Producto.belongsTo(models.Tienda, {
      foreignKey: 'tiendaId',
      as: 'tienda'
    });

    // Relación con detalle_pedidos (ventas)
    Producto.hasMany(models.DetallePedido, {
      foreignKey: 'producto_id',
      as: 'detalles'
    });
  };

  return Producto;
};
