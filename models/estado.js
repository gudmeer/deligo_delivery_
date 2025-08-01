module.exports = (sequelize, DataTypes) => {
  const Estado = sequelize.define('Estado', {
    nombre: DataTypes.STRING 
  });

  Estado.associate = (models) => {
    Estado.hasMany(models.Pedido);
    Estado.hasMany(models.Factura);
  };

  return Estado;
};
