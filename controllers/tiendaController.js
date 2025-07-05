const { Tienda } = require('../models');

// =================== OBTENER TODAS LAS TIENDAS ===================
exports.obtenerTiendas = async (req, res) => {
  try {
    const tiendas = await Tienda.findAll();
    res.json(tiendas);
  } catch (error) {
    console.error('Error al obtener tiendas:', error);
    res.status(500).json({ mensaje: 'Error al obtener tiendas', error: error.message });
  }
};

// =================== CREAR TIENDA NUEVA ===================
exports.crearTienda = async (req, res) => {
  const { nombre, direccion, telefono } = req.body;
  const usuarioId = req.user && req.user.id;

  if (!usuarioId) {
    return res.status(401).json({ mensaje: 'Usuario no autenticado' });
  }

  if (!nombre || !direccion) {
    return res.status(400).json({ mensaje: 'Nombre y dirección son obligatorios' });
  }

  try {
    // Evitar duplicados para un mismo usuario
    const existe = await Tienda.findOne({ where: { usuarioId } });
    if (existe) return res.status(400).json({ mensaje: 'Ya tiene una tienda registrada' });

    const nuevaTienda = await Tienda.create({ nombre, direccion, telefono, usuarioId });
    res.status(201).json({ msg: 'Tienda registrada correctamente', tienda: nuevaTienda });
  } catch (error) {
    console.error('Error al crear tienda:', error);
    res.status(500).json({ mensaje: 'Error al crear tienda', error: error.message });
  }
};
