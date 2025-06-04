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
const dashboardRoutes = require('./src/api/routes/dashboardRoutes');
const analysisRoutes = require('./src/api/routes/analysisRoutes');
const profileRoutes = require('./src/api/routes/profileRoutes');
const settingsRoutes = require('./src/api/routes/settingsRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

try {
    const swaggerDocumentPath = path.join(__dirname, '../docs/api/swagger.yaml');
    const swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.error("[API Docs] Error al cargar el archivo swagger.yaml:", e.message);
}

app.use('/api', userRoutes);
app.use('/api', objectivesRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API de Seguimiento de Metas Personales funcionando correctamente. Documentación en /api-docs'
    });
});

app.get('/', (req, res) => {
    res.send('Servidor Backend TFG. Accede a /api para los endpoints o /api-docs para la documentación.');
});

app.all('*', (req, res, next) => {
    next(new AppError(`La ruta ${req.originalUrl} no se ha encontrado en este servidor.`, 404));
});

app.use(errorHandler);

module.exports = app;
