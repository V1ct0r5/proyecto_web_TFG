const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('objetivos_personales', 'root', 'V194d2012@', {
  host: 'localhost', // o la dirección del servidor de tu base de datos
  dialect: 'mysql',
});

module.exports = sequelize;