module.exports = (sequelize, DataTypes) => {
const Factura = sequelize.define("Factura", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  montoTotal: {
    type: DataTypes.FLOAT,
  }
}, {
  // Esto evita que Sequelize genere `EstadoId`, `PedidoId`, etc.
  underscored: true, // usa snake_case en lugar de camelCase
});

  Factura.associate = (models) => {
  Factura.belongsTo(models.Pedido, {
    foreignKey: 'pedido_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  Factura.belongsTo(models.Estado, {
    foreignKey: 'estado_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
};

  return Factura;
};
