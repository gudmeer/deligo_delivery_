// controllers/adminController.js
const { Sequelize } = require('sequelize');
const {
  User,
  Tienda,
  Pedido,
  Producto,
  DetallePedido,
  Estado,
  Vehiculo,
  sequelize          // 👈 asegúrate de exportarlo en models/index.js
} = require('../models');

const ESTADOS = {
  PENDIENTE : 1,
  ACEPTADO  : 2,
  EN_CAMINO : 3,
  ENTREGADO : 4,
  ANULADO   : 5
};

/* ─────────────── Helper: restaurar stock ─────────────── */
async function restaurarStock(detalles, t) {
  await Promise.all(detalles.map(dp =>
    Producto.increment(
      { stock: dp.cantidad },
      { where: { id: dp.producto_id }, transaction: t }
    )
  ));
}

/* ─────────────── Controlador ─────────────── */
module.exports = {

  /* 🔹 Estadísticas */
  async getEstadisticas(req, res) {
    try {
      const [totalUsuarios, totalNegocios, totalRepartidores, totalPedidos] =
        await Promise.all([
          User.count(),
          Tienda.count(),
          User.count({ where: { rol: 'repartidor' } }),
          Pedido.count()
        ]);

      res.json({ totalUsuarios, totalNegocios, totalRepartidores, totalPedidos });
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
    }
  },

  /* 🔹 Supervisión de productos */
  async getProductos(req, res) {
    try {
      const productos = await Producto.findAll({
        include: { model: Tienda, as: 'tienda' },
        order: [['createdAt', 'DESC']]
      });
      res.json(productos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error al obtener productos' });
    }
  },

  /* 🔹 Ocultar / mostrar producto */
  async toggleProducto(req, res) {
    try {
      const producto = await Producto.findByPk(req.params.id);
      if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });

      producto.visible = !producto.visible;
      await producto.save();
      res.json({ msg: 'Visibilidad actualizada', visible: producto.visible });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error al cambiar visibilidad' });
    }
  },

  /* 🔹 Pedidos (con filtro por estado) */
  async getPedidos(req, res) {
    try {
      const where = {};
      if (req.query.estado) where['$estado.nombre$'] = req.query.estado;

      const pedidos = await Pedido.findAll({
        where,
        include: [
          { model: Tienda, as: 'tienda' },
          { model: User,  as: 'cliente' },
          { model: User,  as: 'repartidor', include: { model: Vehiculo, as: 'vehiculo' } },
          { model: Estado, as: 'estado' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(pedidos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error al obtener pedidos' });
    }
  },

  /* 🔹 Reportes */
  async getReportes(req, res) {
    try {
      // Ventas por negocio
      const ventasNegocio = await Pedido.findAll({
        attributes: [
          [Sequelize.col('tienda.nombre'), 'nombre'],
          [Sequelize.fn('SUM', Sequelize.col('detallePedidos.subtotal')), 'totalVentas']
        ],
        include: [
          { model: Tienda, as: 'tienda', attributes: [] },
          { model: DetallePedido, as: 'detallePedidos', attributes: [] }
        ],
        group: ['tienda.nombre']
      });

      // Entregas por repartidor
      const entregasRepartidor = await Pedido.findAll({
        attributes: [
          [Sequelize.col('repartidor.nombre'), 'nombre'],
          [Sequelize.fn('COUNT', Sequelize.col('Pedido.id')), 'totalEntregas']
        ],
        include: [
          { model: User, as: 'repartidor', attributes: [] }
        ],
        where: { estado_id: ESTADOS.ENTREGADO },
        group: ['repartidor.nombre']
      });

      // Productos más vendidos
      const productosVendidos = await DetallePedido.findAll({
        attributes: [
          [Sequelize.col('producto.nombre'), 'nombre'],
          [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'totalVendidos']
        ],
        include: [
          { model: Producto, as: 'producto', attributes: [] }
        ],
        group: ['producto.nombre'],
        order: [[Sequelize.fn('SUM', Sequelize.col('cantidad')), 'DESC']],
        limit: 10
      });

      res.json({
        ventasNegocio: {
          labels: ventasNegocio.map(v => v.get('nombre')),
          values: ventasNegocio.map(v => parseFloat(v.get('totalVentas')))
        },
        entregasRepartidor: {
          labels: entregasRepartidor.map(e => e.get('nombre')),
          values: entregasRepartidor.map(e => parseInt(e.get('totalEntregas')))
        },
        productosVendidos: {
          labels: productosVendidos.map(p => p.get('nombre')),
          values: productosVendidos.map(p => parseInt(p.get('totalVendidos')))
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error al obtener reportes', error: err.message });
    }
  },

  /* 🔹 BORRAR PEDIDO (admin) */
  async borrarPedido(req, res) {
    const { id } = req.params;

    try {
      await sequelize.transaction(async (t) => {
        const pedido = await Pedido.findByPk(id, {
          include: [{ model: DetallePedido, as: 'detallePedidos' }],
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

        // Restaurar stock solo si el pedido no fue entregado
        if (pedido.estado_id !== ESTADOS.ENTREGADO) {
          await restaurarStock(pedido.detallePedidos, t);
        }

        // Eliminar detalles y pedido
        await DetallePedido.destroy({ where: { pedido_id: id }, transaction: t });
        await pedido.destroy({ transaction: t });

        res.json({ mensaje: 'Pedido borrado correctamente' });
      });
    } catch (err) {
      console.error('Error al borrar pedido:', err);
      res.status(500).json({ mensaje: 'Error al borrar pedido', error: err.message });
    }
  },

  /* 🔹 ANULAR PEDIDO (admin) */
  async anularPedidoAdmin(req, res) {
    try {
      const pedido = await Pedido.findByPk(req.params.id);
      if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

      const estadoAnulado = await Estado.findOne({ where: { nombre: 'anulado' } });
      if (!estadoAnulado) return res.status(400).json({ mensaje: 'Estado "anulado" no existe' });

      if (pedido.estado_id === estadoAnulado.id) {
        return res.status(400).json({ mensaje: 'El pedido ya está anulado' });
      }

      await pedido.update({ estado_id: estadoAnulado.id });
      res.json({ mensaje: 'Pedido anulado correctamente (admin)' });
    } catch (err) {
      console.error('Error al anular pedido (admin):', err);
      res.status(500).json({ mensaje: 'Error al anular pedido', error: err.message });
    }
  }

};

// adminController.js - función getReportes
const [ventasPorTienda] = await sequelize.query(`
  SELECT
    tienda.nombre AS nombre,
    SUM(detallePedidos.subtotal) AS totalVentas
  FROM pedidos AS Pedido
  LEFT JOIN tiendas AS tienda ON Pedido.tienda_id = tienda.id
  LEFT JOIN detalle_pedidos AS detallePedidos ON Pedido.id = detallePedidos.pedido_id
  GROUP BY tienda.nombre;
`);

