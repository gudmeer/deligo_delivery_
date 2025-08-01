module.exports = (sequelize, DataTypes) => {
  const Vehiculo = sequelize.define('Vehiculo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    repartidor_id: DataTypes.INTEGER,
    tipo: DataTypes.STRING,
    placa: DataTypes.STRING
  }, {
    tableName: 'vehiculos', // 
    underscored: true
  });

  Vehiculo.associate = (models) => {
    Vehiculo.belongsTo(models.User, { foreignKey: 'repartidor_id' });
  };

  return Vehiculo;
};
