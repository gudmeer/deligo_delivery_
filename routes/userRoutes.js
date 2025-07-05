const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth.middleware');
const { User } = require('../models');

const auth = authMiddleware;

// ======= Registro y login =======
router.post('/registrar', userController.registrar);
router.post('/login', userController.login);

// ======= Perfil de usuario autenticado =======
router.get('/perfil', auth(), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: err.message });
  }
});

// ======= Obtener todos los usuarios (solo admin) =======
router.get('/', auth('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: err.message });
  }
});

// ======= Actualizar rol de usuario (solo admin) =======
router.put('/:id/rol', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    user.rol = rol;
    await user.save();

    res.json({ mensaje: 'Rol actualizado', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al actualizar rol', error: err.message });
  }
});

// ======= Actualizar estado activo/inactivo (solo admin) =======
router.put('/:id/estado', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    user.activo = activo;
    await user.save();

    res.json({ mensaje: 'Estado actualizado', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al actualizar estado', error: err.message });
  }
});

// ======= Eliminar usuario (solo admin) =======
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err.message });
  }
});

module.exports = router;
