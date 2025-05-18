const express = require('express');

const usuariosRoutes = require('./src/api/routes/userRoutes');
const objetivosRoutes = require('./src/api/routes/objectivesRoutes');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('../docs/api/swagger.yaml');


const app = express();

app.use(express.json());

const cors = require('cors');
app.use(cors());


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/api', usuariosRoutes);
app.use('/api', objetivosRoutes);

module.exports = app;