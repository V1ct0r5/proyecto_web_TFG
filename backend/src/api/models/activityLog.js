const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActivityLog = sequelize.define("ActivityLog", {
        id_activity_log: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios', // Nombre de la tabla de Usuarios
                key: 'id'
            }
        },
        id_objetivo: {
            type: DataTypes.INTEGER,
            allowNull: true, // Importante: debe permitir NULL para ON DELETE SET NULL
            references: {
                model: 'Objetivos', // Nombre de la tabla de Objetivos
                key: 'id_objetivo'
            }
            // La acción onDelete se define en la asociación de abajo
        },
        tipo_actividad: {
            type: DataTypes.ENUM(
                'OBJECTIVE_CREATED',
                'OBJECTIVE_UPDATED', // Considerar si este es genérico o si se necesitarán más específicos
                'PROGRESS_UPDATED',
                'OBJECTIVE_STATUS_CHANGED',
                'OBJECTIVE_DELETED'
            ),
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        detalles_adicionales: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        // 'createdAt' será el timestamp del log, 'updatedAt' está desactivado
    }, {
        tableName: 'ActivityLogs',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        // TODO: Considerar añadir índices para id_usuario, id_objetivo, tipo_actividad, created_at
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.Usuario, {
            foreignKey: 'id_usuario',
            as: 'usuario',
            onUpdate: 'CASCADE'
        });
        ActivityLog.belongsTo(models.Objetivo, {
            foreignKey: 'id_objetivo',
            as: 'objetivo',
            allowNull: true,
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };

    return ActivityLog;
};