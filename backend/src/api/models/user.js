const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define("Usuario", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    correo_electronico: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Usuarios',
    timestamps: true,
  });

  return Usuario;
};