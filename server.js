const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./models'); // Usa models directamente para sync
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Crear servidor y configurar socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Reemplazar en el frontend URL en producción
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para inyectar io en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas API
app.use('/api/tiendas', require('./routes/tiendaRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/pedidos', require('./routes/pedidoRoutes'));
app.use('/api/usuarios', require('./routes/userRoutes'));
app.use('/api/facturas', require('./routes/facturaRoutes'));
app.use('/api/vehiculos', require('./routes/vehiculoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/usuarios', require('./routes/adminUsuarios.routes'));

// Frontend estático
app.use(express.static(path.join(__dirname, 'frontend_delivery')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_delivery', 'login.html'));
});

// Manejo 404
app.use((req, res, next) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejo errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado');

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado');
  });
});

// 🔥 Sincronizar modelos y lanzar servidor
db.sequelize.sync({ alter: true }) // También puedes usar { force: true } solo en desarrollo
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar la base de datos:', err);
    process.exit(1);
  });
