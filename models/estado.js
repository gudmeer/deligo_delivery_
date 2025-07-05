module.exports = (sequelize, DataTypes) => {
  const Estado = sequelize.define('Estado', {
    nombre: DataTypes.STRING // Ej: 'pendiente', 'en camino', 'entregado', 'facturado'
  });

  Estado.associate = (models) => {
    Estado.hasMany(models.Pedido);
    Estado.hasMany(models.Factura);
  };

  return Estado;
};
