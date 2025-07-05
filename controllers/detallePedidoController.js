const { DetallePedido, Pedido, Producto } = require('../models');

exports.getAllDetalles = async (req, res) => {
  try {
    const detalles = await DetallePedido.findAll({
      include: [
        {
          model: Pedido,
          attributes: ['id', 'cliente_id', 'tienda_id', 'estado_id']
        },
        {
          model: Producto,
          attributes: ['id', 'nombre', 'precio']
        }
      ]
    });
    res.status(200).json(detalles);
  } catch (err) {
    console.error('Error al obtener detalles de pedido:', err);
    res.status(500).json({ mensaje: 'Error al obtener detalles de pedido', error: err.message });
  }
};