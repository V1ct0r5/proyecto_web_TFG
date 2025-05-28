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
            references: {
                model: 'Objetivos',
                key: 'id_objetivo'
            }
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios',
                key: 'id'
            }
        },
        fecha_registro: {
            type: DataTypes.DATEONLY, // Solo la fecha, sin la hora
            allowNull: false,
            defaultValue: DataTypes.NOW, // Establece la fecha actual por defecto al crear
            validate: {
                isDate: { msg: 'La fecha de registro debe ser una fecha válida.' }
            }
        },
        valor_actual: {
            type: DataTypes.DECIMAL(10, 2), // Para precisión, ej. 10 dígitos totales, 2 después del decimal
            allowNull: false,
            validate: {
                isDecimal: { msg: 'El valor actual debe ser un número decimal.' },
                min: {
                    args: [0],
                    msg: 'El valor actual no puede ser negativo.' // Mensaje para la validación 'min'
                }
            }
        },
        comentarios: {
            type: DataTypes.TEXT, // TEXT permite comentarios más largos que STRING(500)
            allowNull: true
        }
    }, {
        tableName: 'Progresos', // Nombre explícito de la tabla
        timestamps: true,       // Habilita createdAt y updatedAt
        underscored: true       // Usa snake_case para los nombres de columna autogenerados (ej. created_at)
    });

    Progress.associate = (models) => {
        Progress.belongsTo(models.Objetivo, { // Asumiendo que 'Objetivo' es el nombre del modelo en models
            foreignKey: 'id_objetivo',     // Clave foránea en la tabla Progresos que referencia a Objective
            as: 'objetivo',                // Alias para la asociación
            onDelete: 'CASCADE'            // Si se elimina un Objetivo, se eliminan sus Progresos asociados
        });

        Progress.belongsTo(models.Usuario, { // Asumiendo que 'Usuario' es el nombre del modelo en models
            foreignKey: 'id_usuario',      // Clave foránea en la tabla Progresos que referencia a User
            as: 'usuario',                 // Alias para la asociación
            onDelete: 'CASCADE'            // Si se elimina un Usuario, se eliminan sus Progresos asociados
        });
    };
    return Progress;
};