const { Factura, Pedido } = require('../models');

exports.getAllFacturas = async (req, res) => {
  try {
    const facturas = await Factura.findAll({
      include: {
        model: Pedido,
        attributes: ['id', 'clienteId', 'tiendaId', 'estadoId'],
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(facturas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener facturas', error: err.message });
  }
};
