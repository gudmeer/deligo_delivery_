const { Op } = require('sequelize');
const {
  Pedido,
  DetallePedido,
  Producto,
  Tienda,
  Estado,
  sequelize
} = require('../models');

const ESTADOS = {
  PENDIENTE : 1,
  ACEPTADO  : 2,
  EN_CAMINO : 3,
  ENTREGADO : 4,
  ANULADO   : 5
};

/* ------------------------------------------------------------------ */
/*  Crear pedido (cliente)                                             */
/* ------------------------------------------------------------------ */
exports.crearPedido = async (req, res) => {
  const {
    tiendaId,
    productos = [],
    nombre_cliente,
    direccion_entrega,
    telefono_cliente,
    correo_cliente
  } = req.body;
  const clienteId = req.user.id;

  if (!tiendaId || !productos.length) {
    return res.status(400).json({ mensaje: 'Datos de pedido incompletos' });
  }

  try {
    await sequelize.transaction(async t => {
      /** 1) Pedido */
      const pedido = await Pedido.create({
        tienda_id        : tiendaId,
        cliente_id       : clienteId,
        estado_id        : ESTADOS.PENDIENTE,
        nombre_cliente,
        direccion_entrega,
        telefono_cliente,
        correo_cliente
      }, { transaction: t });

      /** 2) Detalles + actualización de stock */
      for (const p of productos) {
        const producto = await Producto.findByPk(p.id, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!producto) throw new Error(`Producto ID ${p.id} no existe`);
        if (producto.stock < p.cantidad)
          throw new Error(`Stock insuficiente de ${producto.nombre}`);

        await DetallePedido.create({
          pedido_id       : pedido.id,
          producto_id     : p.id,
          cantidad        : p.cantidad,
          precio_unitario : p.precio,
          subtotal        : p.cantidad * p.precio
        }, { transaction: t });

        await producto.update(
          { stock: producto.stock - p.cantidad },
          { transaction: t }
        );
      }

      res.status(201).json({ mensaje: 'Pedido creado', pedidoId: pedido.id });
    });
  } catch (err) {
    console.error('crearPedido:', err);
    res.status(500).json({ mensaje: 'Error al crear pedido', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Pedido activo (no entregado ni anulado)                            */
/* ------------------------------------------------------------------ */
exports.obtenerPedidoActivo = async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
      where: {
        cliente_id: req.user.id,
        estado_id : { [Op.notIn]: [ESTADOS.ENTREGADO, ESTADOS.ANULADO] }
      },
      include: [
        { model: Estado, as: 'estado', attributes: ['nombre'] },
        {
          model: DetallePedido, as: 'detallePedidos',
          include: [{ model: Producto, attributes: ['nombre'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(pedido);   // null si no existe
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener pedido activo', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/*  Aceptar pedido (negocio)                                          */
/* ------------------------------------------------------------------ */
exports.aceptarPedido = async (req, res) => {
  try {
    const pedidoId = req.params.id;

    // Buscar el pedido
    const pedido = await Pedido.findByPk(pedidoId);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (pedido.estado_id !== ESTADOS.PENDIENTE) {
      return res.status(400).json({ mensaje: 'El pedido ya ha sido procesado' });
    }

    // Actualizar el estado a ACEPTADO
    await pedido.update({ estado_id: ESTADOS.ACEPTADO });

    res.json({ mensaje: 'Pedido aceptado correctamente' });
  } catch (err) {
    console.error('Error al aceptar pedido:', err);
    res.status(500).json({ mensaje: 'Error al aceptar pedido', error: err.message });
  }
};


/* ------------------------------------------------------------------ */
/*  Historial del cliente                                              */
/* ------------------------------------------------------------------ */
exports.obtenerHistorialCliente = async (req, res) => {
  try {
    const clienteId = req.user.id;

    const pedidos = await Pedido.findAll({
      where: { cliente_id: clienteId },
      include: [
        { model: Estado, as: 'estado', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detallePedidos',
          include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'precio'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(pedidos);
  } catch (err) {
    console.error('Error al obtener historial del cliente:', err);
    res.status(500).json({ mensaje: 'Error al obtener historial del cliente' });
  }
};

/* ------------------------------------------------------------------ */
/*  Anular pedido (cliente)                                            */
/* ------------------------------------------------------------------ */
exports.anularPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, cliente_id: req.user.id }
    });
    if (!pedido)
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    if ([ESTADOS.EN_CAMINO, ESTADOS.ENTREGADO, ESTADOS.ANULADO].includes(pedido.estado_id))
      return res.status(400).json({ mensaje: 'No puedes anular este pedido' });

    await pedido.update({ estado_id: ESTADOS.ANULADO });
    res.json({ mensaje: 'Pedido anulado exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al anular pedido', error: err.message });
  }
};


exports.anularPedidoAdmin = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    const estadoAnulado = await Estado.findOne({ where: { nombre: 'anulado' } });
    if (!estadoAnulado) return res.status(400).json({ mensaje: 'Estado "anulado" no existe' });

    if (pedido.estado_id === estadoAnulado.id) {
      return res.status(400).json({ mensaje: 'El pedido ya está anulado' });
    }

    pedido.estado_id = estadoAnulado.id;
    await pedido.save();

    res.json({ mensaje: 'Pedido anulado correctamente (admin)' });
  } catch (err) {
    console.error('Error al anular pedido (admin):', err);
    res.status(500).json({ mensaje: 'Error al anular pedido', error: err.message });
  }
};
