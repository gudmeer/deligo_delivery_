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
  underscored: true, 
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
