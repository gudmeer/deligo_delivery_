const { User, Tienda } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =================== REGISTRO ===================
exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validar email simple
    if (!email.includes('@')) {
      return res.status(400).json({ msg: 'Email inválido' });
    }

    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(400).json({ msg: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      nombre,
      email,
      password: hashed,
      rol: rol || 'cliente',
      activo: true // default activo
    });

    // 🔥 Si es negocio, generar token y marcar que debe registrar su tienda
    if (user.rol === 'negocio') {
      const payload = { id: user.id, rol: user.rol };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto123', { expiresIn: '2h' });

      return res.status(201).json({
        msg: 'Usuario negocio registrado. Debe registrar su tienda.',
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
        necesitaTienda: true
      });
    }

    // Para otros roles, confirmar registro
    const { password: _, ...userSinPassword } = user.toJSON();
    res.status(201).json({ msg: 'Usuario registrado', user: userSinPassword });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ msg: 'Error del servidor', error: error.message });
  }
};

// =================== LOGIN ===================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) return res.status(401).json({ msg: 'Contraseña incorrecta' });

    if (!user.activo) return res.status(403).json({ msg: 'Usuario inactivo. Contacta al admin.' });

    let tienda_id = null;

    if (user.rol === 'negocio') {
      const tienda = await Tienda.findOne({ where: { usuarioId: user.id } });
      if (!tienda) {
        // Si es negocio y no tiene tienda, devolver token pero avisar
        const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET || 'secreto123', { expiresIn: '2h' });
        return res.status(200).json({
          msg: 'Login exitoso. Debe registrar su tienda.',
          token,
          rol: user.rol,
          necesitaTienda: true
        });
      }
      tienda_id = tienda.id;
    }

    const payload = { id: user.id, rol: user.rol, ...(tienda_id && { tienda_id }) };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto123', { expiresIn: '2h' });

    res.json({
      msg: 'Login exitoso',
      token,
      rol: user.rol,
      ...(tienda_id && { tienda_id })
    });

  } catch (error) {
    console.error('🔥 Error en login:', error);
    res.status(500).json({ msg: 'Error del servidor', error: error.message });
  }
};

// =================== ACTUALIZAR ROL ===================
exports.actualizarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    user.rol = rol;
    await user.save();

    res.json({ msg: 'Rol actualizado', user });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ msg: 'Error del servidor', error: error.message });
  }
};

// =================== ACTUALIZAR ESTADO ===================
exports.actualizarEstado = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    user.activo = activo;
    await user.save();

    res.json({ msg: 'Estado actualizado', user });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ msg: 'Error del servidor', error: error.message });
  }
};

// =================== ELIMINAR USUARIO ===================
exports.eliminar = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ msg: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ msg: 'Error del servidor', error: error.message });
  }
};
