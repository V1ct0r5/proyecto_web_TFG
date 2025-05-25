const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Progress = sequelize.define('Progress', {
        id_progreso: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        id_objetivo: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_usuario: { // Asumiendo que el progreso también se asocia directamente a un usuario
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha_registro: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: { msg: 'La fecha de registro debe ser una fecha válida.' }
            }
        },
        valor_actual: {
            type: DataTypes.FLOAT, // o DataTypes.DECIMAL si prefieres más precisión
            allowNull: false,
            validate: {
                isFloat: { msg: 'El valor actual debe ser un número decimal.' },
                notNull: { msg: 'El valor actual no puede ser nulo.' }, // redundante si allowNull es false, pero no daña
                min: {
                    args: [0], // <<< ASEGÚRATE DE QUE 'args' SEA UN ARRAY CON EL NÚMERO, ej. [0]
                    msg: 'El valor actual no puede ser negativo.'
                }
            }
        },
        comentarios: {
            type: DataTypes.STRING(500), // Longitud explícita, o DataTypes.TEXT si son muy largos
            allowNull: true
        }
    }, {
      tableName: 'Progresos', 
      timestamps: true,
      underscored: true
  });

  Progress.associate = (models) => {
      Progress.belongsTo(models.Objective, {
          foreignKey: 'id_objetivo',
          as: 'objetivo',
          references: {
              model: 'Objetivo', // <-- CAMBIADO de 'objectives' a 'Objetivos'
              key: 'id_objetivo'  // <-- CAMBIADO de 'id' a 'id_objetivo' si es el PK de Objetivos
          },
          onDelete: 'CASCADE'
      });
      Progress.belongsTo(models.User, {
          foreignKey: 'id_usuario',
          as: 'usuario',
          references: {
              model: 'Usuario', // <-- CAMBIADO de 'users' a 'Usuarios'
              key: 'id'
          },
          onDelete: 'CASCADE'
      });
  };

  return Progress;
};