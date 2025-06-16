// backend/src/api/services/objectivesService.js
const objectiveRepository = require('../repositories/objectiveRepository');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objective, Progress, ActivityLog } = db;

// --- Helper Functions ---

/**
 * Calculates the progress percentage of an objective.
 * This function is exported to be reused by other services (analysis, dashboard).
 * @param {object} objective - The objective object.
 * @returns {number} The progress percentage (0-100).
 */
const calculateProgressPercentage = (objective) => {
    const { initialValue, currentValue, targetValue, isLowerBetter } = objective;

    const numInitial = parseFloat(initialValue);
    const numTarget = parseFloat(targetValue);
    const numCurrent = currentValue !== null ? parseFloat(currentValue) : numInitial;

    if (isNaN(numInitial) || isNaN(numCurrent) || isNaN(numTarget)) {
        return 0;
    }

    if (numTarget === numInitial) {
        return (isLowerBetter ? numCurrent <= numTarget : numCurrent >= numTarget) ? 100 : 0;
    }

    let progress;
    // CORRECCIÓN: Se usa consistentemente 'numTarget' en lugar de 'targetValue' para evitar errores de tipo.
    if (isLowerBetter) {
        progress = ((numInitial - numCurrent) / (numInitial - numTarget)) * 100;
    } else {
        progress = ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;
    }
        
    // Se redondea el progreso y se asegura que esté entre 0 y 100.
    return Math.max(0, Math.min(100, Math.round(progress)));
};

// Export the helper function for use in other services
exports.calculateProgressPercentage = calculateProgressPercentage;

/**
 * Checks if an objective is overdue and updates its status in memory.
 */
const checkAndUpdateOverdueStatus = (objectiveJson) => {
    const deadline = objectiveJson.endDate ? new Date(objectiveJson.endDate) : null;
    const isOverdue = deadline && deadline < new Date() && !['COMPLETED', 'ARCHIVED'].includes(objectiveJson.status);

    if (isOverdue) {
        objectiveJson.status = 'FAILED';
    }
    return objectiveJson;
};


/**
 * Service layer for objectives-related business logic.
 */
class ObjectivesService {

    /**
     * Retrieves all objectives for a user, applying filters and calculating progress.
     */
    async getAllObjectives(userId, filters = {}) {
        const objectives = await objectiveRepository.findAll(userId, filters);
        
        let processedObjectives = objectives.map(obj => {
            let objectiveJson = obj.toJSON();
            objectiveJson = checkAndUpdateOverdueStatus(objectiveJson); // Check if overdue
            objectiveJson.progressPercentage = calculateProgressPercentage(objectiveJson);
            return objectiveJson;
        });

        // Sort by calculated progress if specified, as this can't be done in the DB.
        if (filters.sortBy === 'progressAsc') {
            processedObjectives.sort((a, b) => a.progressPercentage - b.progressPercentage);
        } else if (filters.sortBy === 'progressDesc') {
            processedObjectives.sort((a, b) => b.progressPercentage - a.progressPercentage);
        }
        
        return processedObjectives;
    }

    /**
     * Retrieves a single objective by its ID, including progress history.
     */
    async getObjectiveById(objectiveId, userId) {
        const objective = await objectiveRepository.findById(objectiveId, userId, {
            include: [{ model: Progress, as: 'progressEntries', order: [['entryDate', 'ASC'], ['createdAt', 'ASC']] }]
        });
        if (!objective) {
            throw new AppError('Objetivo no encontrado.', 404);
        }

        let objectiveJson = objective.toJSON();
        objectiveJson = checkAndUpdateOverdueStatus(objectiveJson);
        objectiveJson.progressPercentage = calculateProgressPercentage(objectiveJson);
        
        return objectiveJson;
    }

    /**
     * Creates a new objective and its initial progress log.
     */
    async createObjective(objectiveData, userId) {
        const transaction = await db.sequelize.transaction();
        try {
            const isQuantitative = objectiveData.initialValue !== undefined && objectiveData.initialValue !== null;

            const dataToCreate = {
                ...objectiveData,
                userId,
                // Si no es cuantitativo, ambos son null. Si lo es, toma el valor proporcionado.
                initialValue: isQuantitative ? objectiveData.initialValue : null,
                currentValue: isQuantitative ? objectiveData.initialValue : null,
            };

            const newObjective = await objectiveRepository.create(dataToCreate, { transaction });

            // Solo creamos una entrada de progreso si el objetivo es cuantitativo.
            if (isQuantitative) {
                await Progress.create({
                    objectiveId: newObjective.id,
                    userId: userId,
                    entryDate: new Date(),
                    value: newObjective.initialValue, // Aquí, initialValue no será null
                    notes: 'Valor inicial del objetivo.'
                }, { transaction });
            }

            // Create activity log entry
            await ActivityLog.create({
                userId,
                objectiveId: newObjective.id,
                activityType: 'OBJECTIVE_CREATED',
                descriptionKey: 'activityLog.objectiveCreated',
                additionalDetails: { objectiveName: newObjective.name }
            }, { transaction });

            await transaction.commit();
            
            // Volvemos a llamar a getObjectiveById, ya que es el comportamiento esperado por el controlador.
            // Si esto falla, el error está en getObjectiveById.
            return this.getObjectiveById(newObjective.id, userId);

        } catch (error) {
            await transaction.rollback();
            if (error.name === 'SequelizeValidationError') {
                const messages = error.errors.map(e => e.message).join('. ');
                throw new AppError(`Error de validación: ${messages}`, 400);
            }
            // Añadimos un log para ver el error original si no es de validación
            console.error('Error no manejado en createObjective:', error);
            throw new AppError('Error al crear el objetivo.', 500, error);
        }
    }

    /**
     * Updates an existing objective. Can handle both objective data and progress updates.
     */
    async updateObjective(objectiveId, userId, updateData) {
        const transaction = await db.sequelize.transaction();
        try {
            const { progressData, ...objectiveData } = updateData;

            const objective = await objectiveRepository.findById(objectiveId, userId, { transaction });
            if (!objective) {
                throw new AppError('Objetivo no encontrado.', 404);
            }

            const originalStatus = objective.status;

            if (Object.keys(objectiveData).length > 0) {
                await objective.update(objectiveData, { transaction });
            }

            if (progressData?.value !== undefined && progressData.value !== null) {
                await this._logProgressUpdate(objective, progressData, userId, transaction);
            }
            
            if (originalStatus !== objective.status) {
                await this._logStatusChange(objective, originalStatus, userId, transaction);
            }

            await transaction.commit();
            return this.getObjectiveById(objective.id, userId);

        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            throw new AppError('Error al actualizar el objetivo.', 500, error);
        }
    }
    
    /**
     * Private helper to log progress updates within a transaction.
     */
    async _logProgressUpdate(objective, progressData, userId, transaction) {
        const newValue = parseFloat(progressData.value);
        if (isNaN(newValue)) {
            throw new AppError('El valor del progreso debe ser un número.', 400);
        }

        objective.currentValue = newValue;
        await objective.save({ transaction });

        await Progress.create({
            objectiveId: objective.id,
            userId: userId,
            entryDate: new Date(),
            value: newValue,
            notes: progressData.notes || null
        }, { transaction });

        await ActivityLog.create({
            userId,
            objectiveId: objective.id,
            activityType: 'PROGRESS_UPDATED',
            descriptionKey: 'activityLog.progressUpdated',
            additionalDetails: { objectiveName: objective.name, newValue: newValue, unit: objective.unit || '' }
        }, { transaction });
    }

    /**
     * Private helper to log status changes within a transaction.
     */
    async _logStatusChange(objective, originalStatus, userId, transaction) {
        await ActivityLog.create({
            userId,
            objectiveId: objective.id,
            activityType: 'OBJECTIVE_STATUS_CHANGED',
            descriptionKey: 'activityLog.statusChanged',
            additionalDetails: { objectiveName: objective.name, oldStatus: originalStatus, newStatus: objective.status }
        }, { transaction });
    }

    /**
     * Deletes an objective.
     */
    async deleteObjective(objectiveId, userId) {
        const transaction = await db.sequelize.transaction();
        try {
            const objective = await objectiveRepository.findById(objectiveId, userId, { transaction });
            if (!objective) {
                throw new AppError('Objetivo no encontrado.', 404);
            }
            
            await ActivityLog.create({
                userId,
                objectiveId: objectiveId,
                activityType: 'OBJECTIVE_DELETED',
                descriptionKey: 'activityLog.objectiveDeleted',
                additionalDetails: { objectiveName: objective.name }
            }, { transaction });

            await objectiveRepository.delete(objectiveId, userId, { transaction });
            
            await transaction.commit();
            return { message: `Objetivo '${objective.name}' eliminado correctamente.` };

        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            throw new AppError('Error al eliminar el objetivo.', 500, error);
        }
    }

    /**
     * Checks if a user has any objectives.
     */
    async userHasObjectives(userId) {
        const count = await Objective.count({ where: { userId } });
        return count > 0;
    }
}

const objectivesServiceInstance = new ObjectivesService();

module.exports = objectivesServiceInstance;
module.exports.calculateProgressPercentage = calculateProgressPercentage;