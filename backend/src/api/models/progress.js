const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Progress = sequelize.define('Progress', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_objetivo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Buena práctica: referenciar la tabla y columna
                model: 'Objetivos', // Nombre de la tabla de objetivos
                key: 'id_objetivo'
            }
        },
        id_usuario: { // Asumiendo que el progreso también se asocia directamente a un usuario
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { // Buena práctica: referenciar la tabla y columna
                model: 'Usuarios', // Nombre de la tabla de usuarios
                key: 'id'
            }
        },
        fecha_registro: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: { msg: 'La fecha de registro debe ser una fecha válida.' }
            }
        },
        valor_actual: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: { msg: 'El valor actual debe ser un número decimal.' },
                notNull: { msg: 'El valor actual no puede ser nulo.' },
                min: { // Ejemplo de validación de rango (ajusta según tu lógica de negocio)
                    args: 0,
                    msg: 'El valor actual no puede ser negativo.'
                }
                // Si el valor actual es un porcentaje o escala, podrías añadir max
                // max: { args: 100, msg: 'El valor actual no puede exceder 100.' }
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
          // ¡IMPORTANTE! Aquí debes usar el nombre EXACTO de la tabla en la DB
          references: {
              model: 'Objetivos', // <-- CAMBIADO de 'objectives' a 'Objetivos'
              key: 'id_objetivo'  // <-- CAMBIADO de 'id' a 'id_objetivo' si es el PK de Objetivos
          },
          onDelete: 'CASCADE'
      });
      Progress.belongsTo(models.User, {
          foreignKey: 'id_usuario',
          as: 'usuario',
          // ¡IMPORTANTE! Aquí debes usar el nombre EXACTO de la tabla en la DB
          references: {
              model: 'Usuarios', // <-- CAMBIADO de 'users' a 'Usuarios'
              key: 'id'
          },
          onDelete: 'CASCADE'
      });
  };

  return Progress;
};