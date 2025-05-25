// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet'); // <--- Añadido
const compression = require('compression'); // <--- Añadido
const { sequelize } = require('./src/config/database');
const usuariosRoutes = require('./src/api/routes/userRoutes');
const objetivosRoutes = require('./src/api/routes/objectivesRoutes');
const errorHandler = require('./src/middlewares/errorHandler');
const transactionMiddleware = require('./src/middlewares/transactionMiddleware'); // Asegúrate que la ruta es correcta

const app = express();

// Middlewares base
app.use(cors()); // Habilitar CORS para todas las rutas y orígenes
app.use(helmet()); // <--- Añadido: Establece varias cabeceras HTTP de seguridad
app.use(compression()); // <--- Añadido: Comprime las respuestas HTTP

app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Morgan para logging de solicitudes HTTP (en modo 'dev' para desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware de transacción (si es aplicable globalmente o en rutas específicas)
// Considera si quieres que todas las rutas usen transacciones o solo algunas.
// Si es solo para algunas, aplica este middleware directamente en esas rutas.
// app.use(transactionMiddleware); // Comentado si no es global

// Rutas de la API
app.use('/api', usuariosRoutes);
app.use('/api', objetivosRoutes);

// Ruta de bienvenida o de estado
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de seguimiento de objetivos.' });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  const AppError = require('./src/utils/AppError'); // Importación local para evitar error de carga circular si AppError usa algo de aquí
  next(new AppError(`No se encuentra ${req.originalUrl} en este servidor`, 404));
});

// Middleware de manejo de errores global (Debe ser el último middleware)
app.use(errorHandler);

module.exports = app;