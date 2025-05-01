const express = require('express');
const db = require('./src/config/database');

const usuariosRoutes = require('./src/api/routes/userRoutes');
const objetivosRoutes = require('./src/api/routes/objectivesRoutes');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('../docs/api/swagger.yaml');


const app = express();

app.use(express.json());

// Descomenta si usas Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


async function startApplication() {
  try {
    await db.initializeDatabase();

    console.log('Base de datos y modelos inicializados.');

    const usuariosRoutes = require('./src/api/routes/userRoutes');
    const objetivosRoutes = require('./src/api/routes/objectivesRoutes');

    app.use('/api', usuariosRoutes);
    app.use('/api', objetivosRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });

  } catch (error) {
    console.error('La aplicación no pudo arrancar debido a un error de base de datos:', error);
    process.exit(1);
  }
}

startApplication();

module.exports = app;