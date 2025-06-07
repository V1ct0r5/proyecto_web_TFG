const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
    telefono: {
      type: DataTypes.STRING(25), // Corregido: sin espacio extra
      allowNull: true,
    },
    biografia: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(2048), // URL puede ser larga
      allowNull: true,
    },
    theme_preference: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system',
    },
    language_preference: {
      type: DataTypes.ENUM('es', 'en'),
      allowNull: false,
      defaultValue: 'es',
    },
    date_format_preference: {
      type: DataTypes.ENUM('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'),
      allowNull: false,
      defaultValue: 'DD/MM/YYYY',
    },
    email_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    push_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'Usuarios',
    timestamps: true,
    underscored: true,

    hooks: {
      // Se ejecuta antes de guardar un nuevo usuario en la BD
      beforeCreate: async (usuario) => {
        if (usuario.contrasena) {
          const salt = await bcrypt.genSalt(10);
          usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
        }
      },
      // Se ejecuta antes de actualizar un usuario existente
      beforeUpdate: async (usuario) => {
        // Solo cifra la contraseña si el campo 'contrasena' ha cambiado
        if (usuario.changed('contrasena')) {
          const salt = await bcrypt.genSalt(10);
          usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
        }
      }
    }
  });

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Objetivo, {
        foreignKey: 'id_usuario', 
        as: 'objetivos',         
        onDelete: 'CASCADE'      
    });
    Usuario.hasMany(models.Progress, {
        foreignKey: 'id_usuario', 
        as: 'progresos',         
        onDelete: 'CASCADE'      
    });
    Usuario.hasMany(models.ActivityLog, { // Asociación añadida
      foreignKey: 'id_usuario',
      as: 'activityLogs',
      onDelete: 'CASCADE'
    });
  };

  Usuario.prototype.comparePassword = async function (candidatePassword) {
    // Compara la contraseña que envía el usuario con la que está hasheada en la BD
    return bcrypt.compare(candidatePassword, this.contrasena);
  };

  return Usuario;
};