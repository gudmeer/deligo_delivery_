const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, sequelize } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Cambia a tu frontend exacto en producción
  }
});

// 🌍 Log básico de entorno en desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('DB_PASS cargado:', process.env.DB_PASS);
}

// 🧩 Middlewares
app.use(cors());
app.use(express.json());

// Middleware para que rutas puedan emitir eventos con Socket.IO
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 📦 Rutas API
app.use('/api/tiendas', require('./routes/tiendaRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/pedidos', require('./routes/pedidoRoutes'));
app.use('/api/usuarios', require('./routes/userRoutes'));
app.use('/api/facturas', require('./routes/facturaRoutes'));
app.use('/api/vehiculos', require('./routes/vehiculoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/usuarios', require('./routes/adminUsuarios.routes'));

// 🌐 Servir frontend estático
app.use(express.static(path.join(__dirname, 'frontend_delivery')));

// 🧭 Fallback para rutas del frontend (SPA o páginas sueltas)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_delivery', 'login.html'));
});

// ❌ 404 - Ruta no encontrada para API (sólo si no es archivo estático)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ mensaje: 'Ruta de API no encontrada' });
  }
  next();
});

// 💥 Manejo general de errores
app.use((err, req, res, next) => {
  console.error('Error interno:', err.stack);
  res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

// 🔌 Socket.IO conexión
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// 🚀 Iniciar servidor y conectar BD
sequelize.sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  });
