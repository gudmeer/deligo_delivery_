const { Vehiculo } = require('../models');

exports.getAllVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll();
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
