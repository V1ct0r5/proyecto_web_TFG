const express = require('express');
// const db = require('./src/config/database'); // Ya no inicializamos DB aquí

const usuariosRoutes = require('./src/api/routes/userRoutes');
const objetivosRoutes = require('./src/api/routes/objectivesRoutes');

// Descomenta si usas Swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
// Asegúrate de que la ruta a swagger.yaml es correcta desde la raíz del backend
// const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api/swagger.yaml')); // Mejor usar path.join si mueves el .env
// Re-añade la importación de path si usas path.join
// const path = require('path');
const swaggerDocument = YAML.load('../docs/api/swagger.yaml'); // Asumiendo que corres index.js desde la raíz del backend


const app = express();

// Middleware para parsear JSON en el body de las peticiones
app.use(express.json());

// Configuración de CORS (necesario para que el frontend en otro puerto pueda conectar)
// Asegúrate de tener 'cors' instalado: npm install cors
const cors = require('cors');
app.use(cors()); // Esto permite peticiones desde cualquier origen. Configúralo si quieres restringir.


// Descomenta si usas Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Montar las rutas API. ¡Importante! Las rutas deben ser requeridas
// *después* de configurar middlewares como cors y body-parser (express.json)
// y *antes* de exportar app si no usas un archivo de inicio separado.
// En este caso, las requerimos e importamos arriba, pero se usan aquí.

app.use('/api', usuariosRoutes);
app.use('/api', objetivosRoutes);

// Exportar la instancia configurada de la aplicación Express
module.exports = app;