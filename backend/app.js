// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const path = require('path');
const fs = require('fs');

const AppError = require('./src/utils/AppError');
const errorHandler = require('./src/middlewares/errorHandler');

// Importar todas las rutas
const userRoutes = require('./src/api/routes/userRoutes');
const objectivesRoutes = require('./src/api/routes/objectivesRoutes');
const dashboardRoutes = require('./src/api/routes/dashboardRoutes');
const analysisRoutes = require('./src/api/routes/analysisRoutes');
const profileRoutes = require('./src/api/routes/profileRoutes');
const settingsRoutes = require('./src/api/routes/settingsRoutes');

const app = express();

// --- Middlewares Esenciales ---

// Opciones de CORS más seguras
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};
app.use(cors(corsOptions));

// Configuración de Helmet, permitiendo que los recursos sean de origen cruzado (necesario para el avatar)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middlewares de parseo de JSON y URL-encoded con límites de payload
app.use(express.json({ limit: '50kb' })); // Aumentado ligeramente por si hay descripciones largas
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Middleware de compresión de respuestas
app.use(compression());

// Middleware de logging para el entorno de desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- Rutas Estáticas y de Documentación ---

// Servir archivos estáticos del directorio de subidas (avatares)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Servir documentación de la API con Swagger
try {
    const swaggerDocumentPath = path.join(__dirname, '../docs/api/swagger.yaml');
    const swaggerFile = fs.readFileSync(swaggerDocumentPath, 'utf8');
    const swaggerDocument = YAML.parse(swaggerFile);
    // ---------------------------------------------
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.error("[API Docs] Error al cargar swagger.yaml:", e.message);
}

// --- Rutas de la API ---

app.use('/api/auth', require('./src/api/routes/authRoutes'));
app.use('/api/users', require('./src/api/routes/userRoutes'));
app.use('/api/objectives', require('./src/api/routes/objectivesRoutes'));
app.use('/api/dashboard', require('./src/api/routes/dashboardRoutes'));
app.use('/api/analysis', require('./src/api/routes/analysisRoutes'));
app.use('/api/profile', require('./src/api/routes/profileRoutes'));
app.use('/api/settings', require('./src/api/routes/settingsRoutes'));

// Endpoint raíz de la API
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API de Seguimiento de Metas Personales funcionando. Documentación disponible en /api-docs'
    });
});

// Endpoint raíz del servidor
app.get('/', (req, res) => {
    res.send('Servidor Backend TFG. Acceda a /api para los endpoints o /api-docs para la documentación.');
});


// --- Manejo de Errores ---

// Middleware para rutas no encontradas (404)
app.all('*', (req, res, next) => {
    next(new AppError(`La ruta ${req.originalUrl} no se ha encontrado en este servidor.`, 404));
});

// Middleware de manejo de errores global
app.use(errorHandler);

module.exports = app;