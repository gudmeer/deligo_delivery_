const { Estado } = require('../models');

exports.getAllEstados = async (req, res) => {
  try {
    const estados = await Estado.findAll();
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};