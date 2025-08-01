const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const adminController = require('../controllers/adminController');

// Estadísticas del administrador
router.get('/estadisticas', auth('admin'), adminController.getEstadisticas);

/**Supervisión de Productos
 */
router.get('/productos', auth('admin'), adminController.getProductos);
router.put('/productos/:id/ocultar', auth('admin'), adminController.toggleProducto);

/**Monitoreo de Pedidos
 */
router.get('/pedidos', auth('admin'), adminController.getPedidos);
router.delete('/pedidos/:id', auth('admin'), adminController.borrarPedido);         
router.put('/pedidos/:id/anular', auth('admin'), adminController.anularPedidoAdmin); 

/** Reportes
 */
router.get('/reportes', auth('admin'), adminController.getReportes);

module.exports = router;
