const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/db');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Cambia a tu frontend exacto en producción
  }
});

// 🔧 Middlewares globales
app.use(cors());
app.use(express.json());

// 🔧 Middleware para pasar io en req (para emitir eventos desde rutas)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Rutas API
app.use('/api/tiendas', require('./routes/tiendaRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/pedidos', require('./routes/pedidoRoutes'));
app.use('/api/usuarios', require('./routes/userRoutes'));
app.use('/api/facturas', require('./routes/facturaRoutes'));
app.use('/api/vehiculos', require('./routes/vehiculoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ✅ Rutas del administrador
app.use('/api/admin/usuarios', require('./routes/adminUsuarios.routes'));
// Si crearás más rutas admin (reportes, dashboard), agrégalas aquí con prefijo /api/admin/...

// ✅ Servir frontend estático
app.use(express.static(path.join(__dirname, 'frontend_delivery')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_delivery', 'login.html'));
});

// 🚨 Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// 🚨 Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

// ✅ Socket.io conexión
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// 🔥 Iniciar servidor y sincronizar base de datos
sequelize.sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => { // Usa server.listen para Socket.io
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar con la base de datos:', err);
    process.exit(1);
  });
