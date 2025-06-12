// backend/src/api/models/progress.js
const { DataTypes } = require('sequelize');

/**
 * Defines the Progress model for tracking objective progress entries.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @returns {ModelCtor<Model>} The Progress model.
 */
module.exports = (sequelize) => {
    const Progress = sequelize.define('Progress', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'id_progreso'
        },
        objectiveId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Objetivos', key: 'id_objetivo' },
            field: 'id_objetivo'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Usuarios', key: 'id' },
            field: 'id_usuario'
        },
        entryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            validate: { isDate: { msg: 'La fecha de registro debe ser una fecha válida.' } },
            field: 'fecha_registro'
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: { msg: 'El valor debe ser un número decimal.' },
                min: { args: [0], msg: 'El valor no puede ser negativo.' }
            },
            field: 'valor_actual'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'comentarios'
        }
    }, {
        tableName: 'Progresos',
        timestamps: true,
        underscored: true
    });

    Progress.associate = (models) => {
        Progress.belongsTo(models.Objective, {
            foreignKey: 'objectiveId',
            as: 'objective',
            onDelete: 'CASCADE'
        });

        Progress.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
    };
    return Progress;
};