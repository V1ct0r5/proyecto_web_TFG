// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = 'morgan';
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const AppError = require('./src/utils/AppError');
const userRoutes = require('./src/api/routes/userRoutes');
const objectivesRoutes = require('./src/api/routes/objectivesRoutes');
const dashboardRoutes = require('./src/api/routes/dashboardRoutes'); // Nuevas rutas del dashboard
const errorHandler = require('./src/middlewares/errorHandler');
// const transactionMiddleware = require('./src/middlewares/transactionMiddleware'); // Middleware de transacciones, generalmente no se aplica globalmente

const app = express();

// --- Middlewares Esenciales y de Seguridad ---
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Origen permitido para el frontend
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras HTTP permitidas
    credentials: true, // Habilitar si se usan cookies o sesiones con credenciales
    optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

app.use(helmet()); // Establece varias cabeceras HTTP para mejorar la seguridad
app.use(express.json({ limit: '10kb' })); // Middleware para parsear JSON, con límite de tamaño
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Middleware para parsear cuerpos URL-encoded, con límite
app.use(compression()); // Comprime las respuestas HTTP para un mejor rendimiento

// Logging de peticiones HTTP (útil en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- Documentación de la API (Swagger / OpenAPI) ---
try {
    // Ajustada la ruta para encontrar swagger.yaml si la estructura de carpetas cambió
    const swaggerDocumentPath = path.join(__dirname, '../docs/api/swagger.yaml'); 
    const swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.error("[API Docs] Error al cargar el archivo swagger.yaml:", e.message);
    // Considerar si este error debe impedir el arranque de la aplicación.
}

// --- Rutas de la API ---
app.use('/api', userRoutes);
app.use('/api', objectivesRoutes);
app.use('/api', dashboardRoutes); // Registro de las nuevas rutas del dashboard

// Ruta raíz de la API para verificar el estado del backend
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API de Seguimiento de Metas Personales funcionando correctamente. Documentación en /api-docs'
    });
});

// Ruta raíz del servidor (opcional, para un mensaje de bienvenida o informativo)
app.get('/', (req, res) => {
    res.send('Servidor Backend TFG. Accede a /api para los endpoints o /api-docs para la documentación.');
});


// --- Manejo de Rutas No Encontradas (404) ---
// Este middleware captura todas las peticiones a rutas no definidas previamente
app.all('*', (req, res, next) => {
    next(new AppError(`La ruta ${req.originalUrl} no se ha encontrado en este servidor.`, 404));
});

// --- Middleware Global de Manejo de Errores ---
// Debe ser el último middleware que se registra en la aplicación.
app.use(errorHandler);

module.exports = app;