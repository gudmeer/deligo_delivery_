const { Producto, Tienda } = require('../models');

// 🔹 Crear producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body;
    const tiendaId = req.user.tienda_id;

    if (!tiendaId) {
      return res.status(400).json({ mensaje: 'Tienda no registrada. Registra tu tienda antes de crear productos.' });
    }

    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock,
      tiendaId
    });

    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
};

// 🔹 Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const where = tiendaId ? { tiendaId } : {};
    const productos = await Producto.findAll({ where });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// 🔹 Obtener productos por tienda
exports.obtenerProductosPorTienda = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const productos = await Producto.findAll({ where: { tiendaId } });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos por tienda:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos por tienda', error: error.message });
  }
};

// 🔹 Editar producto
exports.editarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    console.error('Error al editar producto:', error);
    res.status(500).json({ mensaje: 'Error al editar producto', error: error.message });
  }
};

// 🔹 Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
  }
};
