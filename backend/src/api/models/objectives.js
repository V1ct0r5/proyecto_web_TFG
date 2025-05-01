const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Objetivo = sequelize.define("Objetivo", {
    id_objetivo: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre no puede estar vacío"
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    tipo_objetivo: {
      type: DataTypes.ENUM('Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros'),
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
      validate: {
        isAfter: {
          args: sequelize.literal('fecha_inicio'),
          msg: "La fecha de fin debe ser posterior a la fecha de inicio"
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'En progreso', 'Completado'),
      defaultValue: 'Pendiente',
      allowNull: false,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: 'Objetivos',
    timestamps: true,
  });

  return Objetivo;
};