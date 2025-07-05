const express = require('express');
const router = express.Router();
const { Producto, Tienda } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * 🔹 Crear producto (solo negocio)
 */
router.post('/', authMiddleware('negocio'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body;
    const userId = req.user.id;

    // ➡️ Obtener tienda del usuario autenticado
    const tienda = await Tienda.findOne({ where: { usuarioId: userId } });
    if (!tienda) {
      return res.status(404).json({ msg: 'No tienes tienda registrada' });
    }

    // ➡️ Crear producto vinculado a la tienda
    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock,
      tiendaId: tienda.id
    });

    res.status(201).json({ msg: 'Producto creado', producto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ msg: 'Error al crear producto', error: error.message });
  }
});

/**
 * 🔹 Obtener productos propios (solo negocio)
 */
router.get('/', authMiddleware('negocio'), async (req, res) => {
  try {
    const tienda = await Tienda.findOne({ where: { usuarioId: req.user.id } });
    if (!tienda) {
      return res.status(404).json({ msg: 'No tienes tienda registrada' });
    }

    const productos = await Producto.findAll({ where: { tiendaId: tienda.id } });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ msg: 'Error al obtener productos', error: error.message });
  }
});

/**
 * 🔹 Obtener productos por tienda (público)
 */
router.get('/tienda/:tiendaId', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { tiendaId: req.params.tiendaId }
    });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos por tienda:', error);
    res.status(500).json({ msg: 'Error al obtener productos por tienda', error: error.message });
  }
});

/**
 * 🔹 Editar producto (solo negocio, solo propios)
 */
router.put('/:id', authMiddleware('negocio'), async (req, res) => {
  try {
    const tienda = await Tienda.findOne({ where: { usuarioId: req.user.id } });
    if (!tienda) {
      return res.status(404).json({ msg: 'No tienes tienda registrada' });
    }

    const producto = await Producto.findOne({
      where: { id: req.params.id, tiendaId: tienda.id }
    });
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado en tu tienda' });
    }

    await producto.update(req.body);
    res.json({ msg: 'Producto actualizado', producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ msg: 'Error al actualizar producto', error: error.message });
  }
});

/**
 * 🔹 Eliminar producto (solo negocio, solo propios)
 */
router.delete('/:id', authMiddleware('negocio'), async (req, res) => {
  try {
    const tienda = await Tienda.findOne({ where: { usuarioId: req.user.id } });
    if (!tienda) {
      return res.status(404).json({ msg: 'No tienes tienda registrada' });
    }

    const producto = await Producto.findOne({
      where: { id: req.params.id, tiendaId: tienda.id }
    });
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado en tu tienda' });
    }

    await producto.destroy();
    res.json({ msg: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ msg: 'Error al eliminar producto', error: error.message });
  }
});
/**
 * 🔹 Actualizar solo el stock de un producto (solo negocio, solo propios)
 */


router.put('/:id/stock', authMiddleware('negocio'), async (req, res) => {
  try {
    const tienda = await Tienda.findOne({ where: { usuarioId: req.user.id } });
    if (!tienda) {
      return res.status(404).json({ msg: 'No tienes tienda registrada' });
    }

    const producto = await Producto.findOne({
      where: { id: req.params.id, tiendaId: tienda.id }
    });
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado en tu tienda' });
    }

    const { stock } = req.body;
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ msg: 'Stock inválido' });
    }

    producto.stock = stock;
    await producto.save();

    res.json({ msg: 'Stock actualizado', producto });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ msg: 'Error al actualizar stock', error: error.message });
  }
});

module.exports = router;
