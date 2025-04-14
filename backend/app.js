const express = require('express');
const app = express();
const sequelize = require('./src/config/database');
const User = require('./src/models/user');
const Objectives = require('./src/models/objectives');
const Progress = require('./src/models/progress');
const usuariosRoutes = require('./src/routes/userRoutes'); // Importa las rutas de usuarios
const objetivosRoutes = require('./src/routes/objectivesRoutes'); // Importa las rutas de objetivos

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

const PORT = 3000; // Define el puerto

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});