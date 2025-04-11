const sequelize = require('./src/config/database');
const User = require('./src/models/user');
const Objectives = require('./src/models/objectives');
const Progress = require('./src/models/progress');

sequelize
  .sync()
  .then(() => {
    console.log('Modelos sincronizados con la base de datos.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelos:', err);
  });

  User.sync()
  .then(() => {
    console.log('Modelo User sincronizado.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelo User:', err);
  });

Objectives.sync()
  .then(() => {
    console.log('Modelo Objectives sincronizado.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelo Objectives:', err);
  });

Progress.sync()
  .then(() => {
    console.log('Modelo Progress sincronizado.');
  })
  .catch((err) => {
    console.error('Error al sincronizar modelo Progress:', err);
  });