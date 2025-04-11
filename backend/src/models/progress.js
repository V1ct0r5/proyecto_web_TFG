const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Progreso = sequelize.define("Progreso", {
    id_progreso: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    valor_logrado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    comentario: {
      type: DataTypes.TEXT,
    },
  });
  
  module.exports = Progreso;