const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware'); // ✅ CORRECTO
const { Factura } = require('../models');

// Obtener todas las facturas (solo admin)
router.get('/', authMiddleware('admin'), async (req, res) => {
  try {
    const facturas = await Factura.findAll();
    res.json(facturas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener facturas', error: err.message });
  }
});

module.exports = router;
