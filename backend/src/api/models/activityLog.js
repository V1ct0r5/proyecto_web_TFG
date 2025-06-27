// backend/src/api/models/activityLog.js
const { DataTypes } = require('sequelize');

/**
 * Defines the ActivityLog model for recording user actions.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {ModelCtor<Model>} The ActivityLog model.
 */
module.exports = (sequelize) => {
    const ActivityLog = sequelize.define("ActivityLog", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'id_activity_log'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'usuario', key: 'id' },
            field: 'id_usuario'
        },
        objectiveId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Permite nulos para que 'ON DELETE SET NULL' funcione
            references: { model: 'objetivo', key: 'id_objetivo' },
            field: 'id_objetivo'
        },
        activityType: {
            type: DataTypes.ENUM(
                'OBJECTIVE_CREATED',
                'PROGRESS_UPDATED',
                'OBJECTIVE_STATUS_CHANGED',
                'OBJECTIVE_DELETED'
            ),
            allowNull: false,
            field: 'tipo_actividad'
        },
        descriptionKey: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Translation key for the activity description.',
            field: 'descripcion'
        },
        additionalDetails: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON object with context-specific data for the activity.',
            field: 'detalles_adicionales'
        },
    }, {
        tableName: 'registroActividad',
        timestamps: true,
        updatedAt: false, // Log entries should be immutable
        underscored: true,
        indexes: [
            { fields: ['id_usuario'] },
            { fields: ['id_objetivo'] },
            { fields: ['created_at'] }
        ]
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onUpdate: 'CASCADE'
        });
        ActivityLog.belongsTo(models.Objective, {
            foreignKey: 'objectiveId',
            as: 'objective',
            onDelete: 'SET NULL', // Si se borra un objetivo, la referencia aquí se vuelve nula pero el log persiste.
            onUpdate: 'CASCADE'
        });
    };

    return ActivityLog;
};