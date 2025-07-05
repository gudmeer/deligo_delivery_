const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_secreta';

const authMiddleware = (rolEsperado) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 🔴 Validar si se envió el token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado o mal formado' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, SECRET_KEY);

      req.user = decoded; // Guardar datos decodificados en req.user

      // 🔴 Si se espera un rol específico
      if (rolEsperado) {
        // Permitir un string o un array de roles
        const rolesPermitidos = Array.isArray(rolEsperado) ? rolEsperado : [rolEsperado];

        if (!rolesPermitidos.includes(req.user.rol)) {
          return res.status(403).json({ mensaje: 'Acceso denegado: rol incorrecto' });
        }
      }

      next(); // ✅ Permitir acceso si no hay restricción o si el rol coincide

    } catch (error) {
      console.error('Error en authMiddleware:', error);
      return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
  };
};

module.exports = authMiddleware;
