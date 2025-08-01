const express = require('express');
const router = express.Router();
const { Vehiculo } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');

// 👉 Aquí pega la ruta POST corregida:

router.post('/', authMiddleware('repartidor'), async (req, res) => {
  try {
    const { tipo, placa } = req.body;
    const repartidor_id = req.user.id; 

    const vehiculo = await Vehiculo.create({
      tipo,
      placa,
      repartidor_id
    });

    res.json({ msg: 'Vehículo registrado', vehiculo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al registrar vehículo' });
  }
});

//////////////////////////////////////////////////////////////////////////////
router.get('/', authMiddleware('repartidor'), async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      where: { repartidor_id: req.user.id }
    });
    res.json(vehiculos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener vehículos' });
  }
});

module.exports = router;
