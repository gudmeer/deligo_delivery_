// routes/tiendaRoutes.js
// -----------------------------------------------------------
// Rutas para gestionar tiendas (negocios) en la plataforma
// -----------------------------------------------------------

const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Tienda } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');

/* =========================================================
   GET /api/tiendas
   🔹 Obtener todas las tiendas
   ========================================================= */
router.get('/', async (req, res) => {
  try {
    const tiendas = await Tienda.findAll();
    res.json(tiendas);
  } catch (error) {
    console.error('Error al obtener tiendas:', error);
    res.status(500).json({ mensaje: 'Error al obtener las tiendas', detalle: error.message });
  }
});

/* =========================================================
   POST /api/tiendas
   🔹 Crear una nueva tienda (solo rol "negocio")
   ========================================================= */
router.post('/', authMiddleware('negocio'), async (req, res) => {
  const { nombre, direccion, telefono } = req.body;
  const usuarioId = req.user.id;

  if (!nombre || !direccion) {
    return res.status(400).json({ mensaje: 'Nombre y dirección son obligatorios' });
  }

  try {
    // Evitar que el mismo usuario registre más de una tienda
    const existente = await Tienda.findOne({ where: { usuarioId } });
    if (existente) {
      return res.status(400).json({ mensaje: 'Ya tienes una tienda registrada' });
    }

    const nuevaTienda = await Tienda.create({ nombre, direccion, telefono, usuarioId });
    res.status(201).json({ mensaje: 'Tienda creada correctamente', tienda: nuevaTienda });

  } catch (error) {
    console.error('Error al crear tienda:', error);
    res.status(500).json({ mensaje: 'Error al crear la tienda', detalle: error.message });
  }
});

/* =========================================================
   GET /api/tiendas/mis-tiendas
   🔹 Obtener la tienda del usuario autenticado (rol "negocio")
   ========================================================= */
router.get('/mis-tiendas', authMiddleware('negocio'), async (req, res) => {
  try {
    const tienda = await Tienda.findOne({ where: { usuarioId: req.user.id } });
    if (!tienda) {
      return res.status(404).json({ mensaje: 'No tienes tienda registrada' });
    }
    res.json(tienda);
  } catch (error) {
    console.error('Error al obtener la tienda:', error);
    res.status(500).json({ mensaje: 'Error al obtener la tienda', detalle: error.message });
  }
});

/* =========================================================
   GET /api/tiendas/buscar?q=...
   🔹 Buscar tiendas por nombre (y/o dirección)
   ⚠️ IMPORTANTE: va antes de "/:id" para que no colisione
   ========================================================= */
router.get('/buscar', async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.status(400).json({ mensaje: 'Debe proporcionar un término de búsqueda' });
  }

  try {
    const tiendas = await Tienda.findAll({
      where: {
        [Op.or]: [
          { nombre:    { [Op.like]: `%${q}%` } },      // Usa Op.iLike si tu BD es PostgreSQL
          { direccion: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.json(tiendas);
  } catch (error) {
    console.error('Error al buscar tiendas:', error);
    res.status(500).json({ mensaje: 'Error al buscar tiendas', detalle: error.message });
  }
});

/* =========================================================
   GET /api/tiendas/:id
   🔹 Obtener una tienda por ID
   ========================================================= */
router.get('/:id', async (req, res) => {
  try {
    const tienda = await Tienda.findByPk(req.params.id);
    if (!tienda) {
      return res.status(404).json({ mensaje: 'Tienda no encontrada' });
    }
    res.json(tienda);
  } catch (error) {
    console.error('Error al obtener tienda por ID:', error);
    res.status(500).json({ mensaje: 'Error al obtener la tienda', detalle: error.message });
  }
});

module.exports = router;
