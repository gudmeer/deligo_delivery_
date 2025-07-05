const express = require('express');
const router = express.Router();
const adminUsuariosController = require('../controllers/adminUsuarios.controller');
const auth = require('../middlewares/auth.middleware');

// ✅ Listar usuarios
router.get('/', auth('admin'), adminUsuariosController.getUsuarios);

// ✅ Cambiar rol
router.put('/:id/rol', auth('admin'), adminUsuariosController.cambiarRol);

// ✅ Activar / Desactivar
router.put('/:id/estado', auth('admin'), adminUsuariosController.toggleEstado);

// ✅ Eliminar usuario
router.delete('/:id', auth('admin'), adminUsuariosController.eliminarUsuario);

module.exports = router;
