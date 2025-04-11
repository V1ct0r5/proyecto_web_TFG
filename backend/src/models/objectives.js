const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Objetivo = sequelize.define("Objetivo", {
  id_objetivo: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  tipo_objetivo: {
    type: DataTypes.STRING(100), // Ej: "Salud", "Productividad", etc.
    allowNull: false,
  },
  valor_cuantitativo: {
    type: DataTypes.DECIMAL,
  },
  unidad_medida: {
    type: DataTypes.STRING(50),
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
  }
});

module.exports = Objetivo;