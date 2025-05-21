const express = require('express');

const usuariosRoutes = require('./src/api/routes/userRoutes');
const objetivosRoutes = require('./src/api/routes/objectivesRoutes');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const errorHandler = require('./src/middlewares/errorHandler');


const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const swaggerDocument = YAML.load('../docs/api/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/api', usuariosRoutes);
app.use('/api', objetivosRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

app.use(errorHandler);
module.exports = app;