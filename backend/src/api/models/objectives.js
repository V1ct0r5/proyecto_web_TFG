const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
        valor_inicial_numerico: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        valor_actual: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0,
        },
        valor_cuantitativo: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        es_menor_mejor: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // Por defecto, un valor mayor es mejor (ej. más dinero, más km recorridos)
        },
        unidad_medida: {
            type: DataTypes.STRING(50),
        },
        fecha_inicio: {
            type: DataTypes.DATEONLY,
        },
        fecha_fin: {
            type: DataTypes.DATEONLY,
        },
        estado: {
            type: DataTypes.ENUM('Pendiente', 'En progreso', 'Completado', 'Archivado', 'Fallido'),
            defaultValue: 'Pendiente',
            allowNull: false,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios',
                key: 'id'
            }
        },
    }, {
        tableName: 'Objetivos',
        timestamps: true,
        underscored: true,
    });

    Objetivo.associate = (models) => {
        Objetivo.belongsTo(models.Usuario, { // Un objetivo pertenece a un usuario
            foreignKey: 'id_usuario',
            as: 'usuario',
            onDelete: 'CASCADE'
        });
        // Si un Objetivo tiene muchos Progress, también iría aquí:
        Objetivo.hasMany(models.Progress, {
            foreignKey: 'id_objetivo',
            as: 'progresos',
            onDelete: 'CASCADE'
        });
    };

    return Objetivo;
};