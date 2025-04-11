const express = require('express');
const app = express();
const sequelize = require('./src/config/database');
const User = require('./src/models/user');
const Objectives = require('./src/models/objectives');
const Progress = require('./src/models/progress');
const usuariosRoutes = require('./src/routes/usuarios'); // Importa las rutas de usuarios
const objetivosRoutes = require('./src/routes/objetivos'); // Importa las rutas de objetivos
const progresoRoutes = require('./src/routes/progreso'); // Importa las rutas de progreso

// Middleware para parsear JSON
app.use(express.json());

sequelize
  .sync()
  .then(() => {
    console.log('Modelos sincronizados con la base de datos.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelos:', err);
  });

// Rutas
app.use('/usuarios', usuariosRoutes); // Conecta las rutas de usuarios
app.use('/objetivos', objetivosRoutes); // Conecta las rutas de objetivos
app.use('/progreso', progresoRoutes); // Conecta las rutas de progreso

const PORT = 3000; // Define el puerto

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});