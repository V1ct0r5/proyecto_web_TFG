const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Usuario = sequelize.define("Usuario", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    correo_electronico: {
      type: DataTypes.STRING(255),
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
  }, {
    tableName: 'Usuarios',
    timestamps: true,
    underscored: true,
  });

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Objetivo, {
        foreignKey: 'id_usuario', // Clave foránea en la tabla 'objectives'
        as: 'objetivos',          // Alias para incluir objetivos con el usuario
        onDelete: 'CASCADE'       // Eliminar objetivos del usuario si el usuario es eliminado
    });
    Usuario.hasMany(models.Progress, {
        foreignKey: 'id_usuario', // Clave foránea en la tabla 'progress'
        as: 'progresos',          // Alias para incluir progresos con el usuario
        onDelete: 'CASCADE'       // Eliminar progresos del usuario si el usuario es eliminado
    });
  };

  return Usuario;
};