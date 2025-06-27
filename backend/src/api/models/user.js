// backend/src/api/models/user.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Defines the User model.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {ModelCtor<Model>} The User model.
 */
module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'nombre_usuario'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      field: 'correo_electronico'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contrasena'
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      field: 'telefono'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'biografia'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'ubicacion'
    },
    avatarUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      field: 'avatar_url'
    },
    // User preferences
    themePreference: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system',
      field: 'preferencia_tema'
    },
    languagePreference: {
      type: DataTypes.ENUM('es', 'en'),
      allowNull: false,
      defaultValue: 'es',
      field: 'preferencia_idioma'
    },
  }, {
    tableName: 'usuario',
    timestamps: true,
    underscored: true,
    hooks: {
      /**
       * Hashes the user's password before creating a new user record.
       */
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      /**
       * Hashes the user's password before updating, but only if the password has changed.
       */
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Objective, { foreignKey: 'userId', as: 'objectives', onDelete: 'CASCADE' });
    User.hasMany(models.ActivityLog, { foreignKey: 'userId', as: 'activityLogs', onDelete: 'CASCADE' });
  };

  /**
   * Compares a candidate password with the user's hashed password.
   * @param {string} candidatePassword - The password to compare.
   * @returns {Promise<boolean>} True if the passwords match.
   */
  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};