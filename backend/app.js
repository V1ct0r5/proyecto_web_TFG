// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const AppError = require('./src/utils/AppError');
const userRoutes = require('./src/api/routes/userRoutes');
const objectivesRoutes = require('./src/api/routes/objectivesRoutes');
const errorHandler = require('./src/middlewares/errorHandler');
// const transactionMiddleware = require('./src/middlewares/transactionMiddleware'); // Generalmente no se aplica globalmente

const app = express();

// --- Middlewares Esenciales y de Seguridad ---
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Permitir el origen del frontend
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
    credentials: true, // Permitir cookies/credenciales si se usan
    optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

app.use(helmet()); // Ayuda a establecer varias cabeceras HTTP de seguridad
app.use(express.json({ limit: '10kb' })); // Parsear JSON, con límite de tamaño para seguridad
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parsear cuerpos URL-encoded, con límite
app.use(compression()); // Comprimir respuestas HTTP para mejor rendimiento

// Logging de peticiones HTTP (principalmente para desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- Documentación de la API (Swagger / OpenAPI) ---
try {
    const swaggerDocumentPath = path.join(__dirname, './docs/api/swagger.yaml');
    const swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    // Opcional: console.log(`[API Docs] Documentación disponible en /api-docs`);
} catch (e) {
    console.error("[API Docs] Error al cargar swagger.yaml:", e.message);
    // Considerar si el fallo al cargar Swagger debe detener la app o solo loguear.
}

// --- Rutas de la API ---
app.use('/api', userRoutes);
app.use('/api', objectivesRoutes);

// Ruta raíz de la API para verificar el estado del backend
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API de Seguimiento de Metas Personales funcionando correctamente. Documentación en /api-docs'
    });
});

// Ruta raíz del servidor (opcional)
app.get('/', (req, res) => {
    res.send('Servidor Backend TFG. Accede a /api para los endpoints o /api-docs para la documentación.');
});


// --- Manejo de Rutas No Encontradas (404) ---
// Captura todas las peticiones a rutas no definidas previamente
app.all('*', (req, res, next) => {
    next(new AppError(`La ruta ${req.originalUrl} no se ha encontrado en este servidor.`, 404));
});

// --- Middleware Global de Manejo de Errores ---
// Debe ser el último middleware registrado.
app.use(errorHandler);

module.exports = app;