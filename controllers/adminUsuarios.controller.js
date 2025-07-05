const { User } = require('../models');

// ✅ Listar todos los usuarios
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await User.findAll();
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// ✅ Cambiar rol de un usuario
exports.cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    user.rol = rol;
    await user.save();

    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al actualizar rol' });
  }
};

// ✅ Activar / Desactivar usuario
exports.toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    user.estado = (user.estado === 'activo') ? 'inactivo' : 'activo';
    await user.save();

    res.json({ mensaje: `Estado cambiado a ${user.estado}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al cambiar estado' });
  }
};

// ✅ Eliminar usuario
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
};
