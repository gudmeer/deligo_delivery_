module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cliente', 
      validate: {
        isIn: [['cliente', 'negocio', 'repartidor', 'admin']]
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true 
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  User.associate = (models) => {
    // Relación con Pedidos como Cliente y como Repartidor
    User.hasMany(models.Pedido, { foreignKey: 'cliente_id', as: 'pedidosCliente' });
    User.hasMany(models.Pedido, { foreignKey: 'repartidor_id', as: 'pedidosRepartidor' });

    // Relación con Tienda (un usuario negocio tiene una tienda)
    User.hasOne(models.Tienda, { foreignKey: 'usuarioId', as: 'tienda' });

    // Relación con Vehículo (un repartidor tiene un vehículo)
    User.hasOne(models.Vehiculo, { foreignKey: 'repartidor_id', as: 'vehiculo' });
  };

  return User;
};
