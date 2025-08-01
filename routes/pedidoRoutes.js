const express = require('express');
const router = express.Router();
const {
  Pedido,
  Producto,
  DetallePedido,
  Factura,
  Estado,
  User,
  sequelize
} = require('../models');
const { Op } = require('sequelize');   
const authMiddleware = require('../middlewares/auth.middleware');
const pedidoController = require('../controllers/pedidoController'); 
const auth = require('../middlewares/auth.middleware'); 



// CLIENTE CREA PEDIDO
router.post('/', authMiddleware('cliente'), async (req, res) => {
  const MAX_RETRIES = 3;
  let attempt = 0, lastErr = null;

  while (attempt < MAX_RETRIES) {
    const t = await sequelize.transaction();
    try {
      const {
        tiendaId,
        productos = [],
        nombre_cliente,
        direccion_entrega,
        telefono_cliente,
        correo_cliente
      } = req.body;

      const clienteId = req.user.id;

      // Validación básica
      if (!tiendaId || productos.length === 0) {
        throw new Error('Datos de pedido incompletos');
      }

      // Crear pedido
      const pedido = await Pedido.create({
        tienda_id: tiendaId,
        cliente_id: clienteId,
        estado_id: 1, // Estado inicial: pendiente
        nombre_cliente,
        direccion_entrega,
        telefono_cliente,
        correo_cliente
      }, { transaction: t });

      // Procesar cada producto
      for (const p of productos) {
        const producto = await Producto.findOne({
          where: { id: p.id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!producto) {
          throw new Error(`Producto ID ${p.id} no existe`);
        }

        if (producto.stock < p.cantidad) {
          throw new Error(`Stock insuficiente de ${producto.nombre}`);
        }

        // Crear detalle de pedido
        await DetallePedido.create({
          pedido_id: pedido.id,
          producto_id: p.id,
          cantidad: p.cantidad,
          precio_unitario: p.precio,
          subtotal: p.precio * p.cantidad
        }, { transaction: t });

        // Actualizar stock
        await producto.update(
          { stock: producto.stock - p.cantidad },
          { transaction: t }
        );
      }

      await t.commit();

      // Retornar respuesta con pedidoId
      return res.status(201).json({
        mensaje: 'Pedido creado exitosamente',
        pedidoId: pedido.id
      });

    } catch (error) {
      if (!t.finished) await t.rollback();

      // Retry en caso de deadlock
      if (error.original?.code === 'ER_LOCK_DEADLOCK') {
        attempt++;
        lastErr = error;
        await new Promise(r => setTimeout(r, 100 * attempt));
        continue;
      }

      console.error('Error al crear pedido:', error);
      return res.status(500).json({
        mensaje: 'Error al crear pedido',
        error: error.message
      });
    }
  }

  // Si persiste deadlock
  return res.status(500).json({
    mensaje: 'Deadlock persistente, inténtalo de nuevo.',
    error: lastErr?.message || 'Unknown'
  });
});

router.get('/cliente/activo',    authMiddleware('cliente'), pedidoController.obtenerPedidoActivo);
router.get('/cliente/historial', authMiddleware('cliente'), pedidoController.obtenerHistorialCliente);
router.put('/:id/anular',        authMiddleware('cliente'), pedidoController.anularPedido);





// NEGOCIO ACEPTA PEDIDO (1→2) Y ASIGNA REPARTIDOR AUTOMÁTICO
router.post('/:id/aceptar', authMiddleware('negocio'), async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    console.log('==============================');
    console.log(`Procesando aceptación de pedido ${pedido.id}`);

    // Obtener todos los repartidores
    const repartidores = await User.findAll({
      where: { rol: 'repartidor' }
    });

    // Log de repartidores encontrados
    if (!repartidores.length) {
      console.log('⚠️ No hay repartidores registrados en la base de datos');
      return res.status(400).json({ mensaje: 'No hay repartidores registrados' });
    }

    console.log('Repartidores encontrados:', repartidores.map(r => ({ id: r.id, nombre: r.nombre })));

    let repartidorDisponible = null;

    // Buscar repartidor sin pedidos en curso
    for (const repartidor of repartidores) {
      const pedidosEnCurso = await Pedido.count({
        where: {
          repartidor_id: repartidor.id,
          estado_id: { [Op.in]: [2, 3] } // estados "aceptado" o "en camino"
        }
      });

      console.log(`Repartidor ${repartidor.id} (${repartidor.nombre}) tiene ${pedidosEnCurso} pedidos en curso`);

      if (pedidosEnCurso === 0) {
        repartidorDisponible = repartidor;
        break;
      }
    }

    if (!repartidorDisponible) {
      console.log('❌ No hay repartidores disponibles sin pedidos en curso');
      return res.status(400).json({ mensaje: 'No hay repartidores disponibles en este momento' });
    }

    // Asignar repartidor y cambiar estado a "aceptado"
    pedido.repartidor_id = repartidorDisponible.id;
    pedido.estado_id = 2; // 2 = aceptado
    await pedido.save();

    console.log(`✅ Pedido ${pedido.id} asignado a repartidor ${repartidorDisponible.id} (${repartidorDisponible.nombre})`);

    // 🚀 Emitir evento Socket.io si usas tiempo real
    req.io.emit('pedido_actualizado', { pedidoId: pedido.id, nuevoEstado: 'aceptado', repartidor: repartidorDisponible.nombre });

    return res.json({
      mensaje: `Pedido aceptado y asignado a ${repartidorDisponible.nombre}`,
      pedidoId: pedido.id,
      repartidorId: repartidorDisponible.id
    });

  } catch (err) {
    console.error('❌ Error en asignación automática:', err);
    return res.status(500).json({ mensaje: 'Error al aceptar y asignar repartidor', error: err.message });
  }
});



// PEDIDOS ASIGNADOS AL REPARTIDOR LOGUEADO
router.get('/repartidor', authMiddleware('repartidor'), async (req, res) => {
  try {
    const repartidorId = req.user.id;

    const pedidos = await Pedido.findAll({
      where: { repartidor_id: repartidorId },
      include: [
        { model: Estado, as: 'estado', attributes: ['id', 'nombre'] },
        {
          model: DetallePedido,
          as: 'detallePedidos',
          include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'precio'] }]
        },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos del repartidor:', error);
    res.status(500).json({ mensaje: 'Error al cargar pedidos', error: error.message });
  }
});


// REPARTIDOR CAMBIA A “EN CAMINO”
router.post('/:id/en-camino', authMiddleware('repartidor'), async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    pedido.estado_id = 2; // en camino
    await pedido.save();

    // Emitir evento a clientes
    req.io.emit('pedido_actualizado', { id: pedido.id, estado: 'en camino' });

    res.json({ mensaje: 'Pedido marcado como en camino' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al actualizar pedido a en camino' });
  }
});


// REPARTIDOR ENTREGA (3→4)
router.post('/:id/entregar', authMiddleware('repartidor'), async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    pedido.estado_id = 3; // entregado
    await pedido.save();

    req.io.emit('pedido_actualizado', { id: pedido.id, estado: 'entregado' });

    res.json({ mensaje: 'Pedido entregado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al entregar pedido' });
  }
});


// ADMIN FACTURA (4→5)
router.post('/:id/facturar', authMiddleware('admin'), async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [{ model: DetallePedido, as: 'detallePedidos' }]
    });

    if (!pedido || pedido.estado_id !== 4)
      return res.status(400).json({ mensaje: 'Pedido no entregado o inexistente' });

    const total = pedido.detallePedidos.reduce((s, d) => s + d.subtotal, 0);
    const factura = await Factura.create({
      pedido_id: pedido.id,
      estado_id: 5,
      montoTotal: total
    });

    pedido.estado_id = 5;
    await pedido.save();

    res.json({ mensaje: 'Factura generada', facturaId: factura.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al facturar' });
  }
});

// PEDIDOS DEL NEGOCIO LOGUEADO
router.get('/negocio', authMiddleware('negocio'), async (req, res) => {
  try {
    const tiendaId = req.user.tienda_id;
    if (!tiendaId) {
      return res.status(400).json({ mensaje: 'No se encontró tienda_id en el usuario autenticado' });
    }

    const pedidos = await Pedido.findAll({
      where: { tienda_id: tiendaId },
      include: [
         { model: Estado, as: 'estado', attributes: ['id', 'nombre'] },
         { model: User, as: 'cliente', attributes: ['id', 'nombre', 'email'] },
        {
          model: DetallePedido,
          as: 'detallePedidos',
          include: [
            { model: Producto, as: 'producto', attributes: ['nombre', 'precio'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos del negocio:', error);
    res.status(500).json({ mensaje: 'Error al cargar pedidos', error: error.message });
  }
});


// VER PEDIDO POR ID
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        {
          model: DetallePedido,
          as: 'detallePedidos',
          include: [{ model: Producto, as: 'producto' }]
        },
        { model: Estado, as: 'estado' }
      ]
    });
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener pedido' });
  }
});

router.put('/:id/anular', authMiddleware('cliente'), pedidoController.anularPedido);
// En routes/pedidoRoutes.js
router.get('/cliente/historial', authMiddleware('cliente'), pedidoController.obtenerHistorialCliente);



/* ------------------------------------------------------------------ */
/*  ADMIN: BORRAR PEDIDO (DELETE)                                      */
/*  URL: DELETE /api/admin/pedidos/:id                                 */
/* ------------------------------------------------------------------ */
router.delete(
  '/admin/pedidos/:id',
  authMiddleware('admin'),
  async (req, res) => {
    const { id } = req.params;

    try {
      await sequelize.transaction(async (t) => {
        // 1. Buscar el pedido
        const pedido = await Pedido.findByPk(id, { transaction: t });
        if (!pedido)
          return res.status(404).json({ mensaje: 'Pedido no encontrado' });

        // 2. Borrar detalles (si la FK NO tiene ON DELETE CASCADE)
        await DetallePedido.destroy({
          where: { pedido_id: id },
          transaction: t
        });

        // 3. Borrar pedido
        await pedido.destroy({ transaction: t });

        // 4. Respuesta OK
        res.json({ mensaje: 'Pedido borrado correctamente' });
      });
    } catch (err) {
      console.error('Error al borrar pedido:', err);
      res
        .status(500)
        .json({ mensaje: 'Error al borrar pedido', error: err.message });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  ADMIN: ANULAR PEDIDO (PUT)                                         */
/*  URL: PUT /api/admin/pedidos/:id/anular                             */
/* ------------------------------------------------------------------ */
router.put(
  '/admin/pedidos/:id/anular',
  authMiddleware('admin'),
  async (req, res) => {
    const { id } = req.params;

    try {
      // Buscamos en paralelo el estado y el pedido
      const [estadoAnulado, pedido] = await Promise.all([
        Estado.findOne({ where: { nombre: 'anulado' } }),
        Pedido.findByPk(id)
      ]);

      if (!pedido)
        return res.status(404).json({ mensaje: 'Pedido no encontrado' });

      if (!estadoAnulado)
        return res
          .status(400)
          .json({ mensaje: 'El estado "anulado" no existe' });

      // Actualizamos el estado
      await pedido.update({ estado_id: estadoAnulado.id });

      res.json({ mensaje: 'Pedido anulado correctamente' });
    } catch (err) {
      console.error('Error al anular pedido:', err);
      res
        .status(500)
        .json({ mensaje: 'Error al anular pedido', error: err.message });
    }
  }
);

module.exports = router;
