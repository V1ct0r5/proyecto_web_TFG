const express = require('express');
const sequelize = require('./src/config/database');
const usuariosRoutes = require('./src/routes/userRoutes');
const objetivosRoutes = require('./src/routes/objectivesRoutes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('../docs/api/swagger.yaml');

// Crear la aplicación Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Conexión y sincronización con la base de datos
sequelize.sync()
  .then(() => {
    console.log('Modelos sincronizados con la base de datos.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelos:', err);
  });

// Rutas
app.use('/usuarios', usuariosRoutes);
app.use('/objetivos', objetivosRoutes);

module.exports = app;