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

    // --- CORRECCIÓN: Manejo robusto de valores ---
    // Si initialValue no existe, asumimos que es 0. Esto es una suposición segura
    // para la mayoría de los casos de progreso.
    const numInitial = parseFloat(initialValue ?? 0); 
    const numTarget = parseFloat(targetValue);

    // Si currentValue no se pasa, usamos el initialValue. Si tampoco existe, es 0.
    const numCurrent = parseFloat(currentValue ?? initialValue ?? 0);

    if (isNaN(numTarget)) {
        // Si no hay un objetivo claro, no se puede calcular el progreso.
        return 0;
    }

    if (numTarget === numInitial) {
        // Si el inicio y el fin son iguales, el progreso es 0% o 100%.
        const isProgressComplete = isLowerBetter ? numCurrent <= numTarget : numCurrent >= numTarget;
        return isProgressComplete ? 100 : 0;
    }

    let progress;
    if (isLowerBetter) {
        // Evita división por cero y maneja la lógica inversa
        progress = ((numInitial - numCurrent) / (numInitial - numTarget)) * 100;
    } else {
        progress = ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;
    }
        
    // Asegurarse de que el progreso esté entre 0 y 100.
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

const processObjectiveForResponse = (objective) => {
    let objectiveJson = objective.toJSON();
    objectiveJson = checkAndUpdateOverdueStatus(objectiveJson);
    objectiveJson.progressPercentage = calculateProgressPercentage(objectiveJson);
    
    // --- SOLUCIÓN DEL WARNING ---
    // El unary plus (+) es un atajo para convertir a número.
    // Manejamos el caso de que el valor sea null para no convertirlo en 0.
    objectiveJson.initialValue = objectiveJson.initialValue != null ? +objectiveJson.initialValue : null;
    objectiveJson.currentValue = objectiveJson.currentValue != null ? +objectiveJson.currentValue : null;
    objectiveJson.targetValue = objectiveJson.targetValue != null ? +objectiveJson.targetValue : null;
    
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
        
        let processedObjectives = objectives.map(processObjectiveForResponse);

        if (filters.sortBy === 'progressAsc') {
            processedObjectives.sort((a, b) => a.progressPercentage - b.progressPercentage);
        } else if (filters.sortBy === 'progressDesc') {
            processedObjectives.sort((a, b) => b.progressPercentage - a.progressPercentage);
        }
        
        return processedObjectives;
    }

    async getObjectiveById(objectiveId, userId) {
        const objective = await objectiveRepository.findById(objectiveId, userId, {
            include: [{ model: Progress, as: 'progressEntries', order: [['entryDate', 'ASC']] }]
        });
        if (!objective) {
            throw new AppError('Objetivo no encontrado.', 404);
        }
        
        return processObjectiveForResponse(objective);
    }

    /**
     * Creates a new objective and its initial progress log.
     */
    async createObjective(objectiveData, userId) {
        const transaction = await db.sequelize.transaction();
        try {
            // 1. Validar que el userId existe antes de hacer nada
            if (!userId) {
                throw new AppError('No se proporcionó un ID de usuario autenticado.', 401);
            }

            // 2. Determinar si es cuantitativo de forma segura
            const isQuantitative = (
                objectiveData.initialValue !== null && objectiveData.initialValue !== undefined &&
                objectiveData.targetValue !== null && objectiveData.targetValue !== undefined
            );

            // 3. Construir el payload para la BD
            const dataToCreate = {
                ...objectiveData,
                userId, // Usar el userId validado
                initialValue: isQuantitative ? objectiveData.initialValue : null,
                targetValue: isQuantitative ? objectiveData.targetValue : null,
                currentValue: isQuantitative ? objectiveData.initialValue : null,
            };

            const newObjective = await objectiveRepository.create(dataToCreate, { transaction });

            // 4. Crear progreso SOLO si es cuantitativo
            if (isQuantitative) {
                await Progress.create({
                    objectiveId: newObjective.id,
                    userId: userId,
                    entryDate: new Date(),
                    value: newObjective.initialValue,
                    notes: 'Valor inicial del objetivo.'
                }, { transaction });
            }

            // 5. Crear log de actividad
            await ActivityLog.create({
                userId,
                objectiveId: newObjective.id,
                activityType: 'OBJECTIVE_CREATED',
                descriptionKey: 'activityLog.objectiveCreated',
                additionalDetails: { objectiveName: newObjective.name }
            }, { transaction });

            await transaction.commit();
            return this.getObjectiveById(newObjective.id, userId);

        } catch (error) {
            await transaction.rollback();
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
                const messages = error.errors ? error.errors.map(e => e.message).join('. ') : error.message;
                throw new AppError(`Error de validación o de referencia: ${messages}`, 400);
            }
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
            const objective = await objectiveRepository.findById(objectiveId, userId, { transaction });
            if (!objective) {
                throw new AppError('Objetivo no encontrado.', 404);
            }
    
            if (objective.status === 'ARCHIVED') {
                const isOnlyArchiving = Object.keys(updateData).length === 1 && updateData.status === 'ARCHIVED';

                if (!isOnlyArchiving) {
                    throw new AppError('No se puede modificar un objetivo que está archivado. Debes desarchivarlo primero.', 400);
                }
            }


            const originalStatus = objective.status;
            if (updateData.status === 'ARCHIVED' && originalStatus !== 'ARCHIVED') {
                updateData.previousStatus = originalStatus;
            }
            
            // Separamos los datos de progreso de los del objetivo.
            const { progressData, ...objectiveData } = updateData;

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
        let activityType = 'OBJECTIVE_STATUS_CHANGED';
        let descriptionKey = 'activityLog.statusChanged';
        if (objective.status === 'ARCHIVED') {
            activityType = 'OBJECTIVE_ARCHIVED';
            descriptionKey = 'activityLog.objectiveArchived';
        }
        await ActivityLog.create({
            userId,
            objectiveId: objective.id,
            activityType,
            descriptionKey,
            additionalDetails: { 
                objectiveName: objective.name,
                oldStatus: originalStatus, 
                newStatus: objective.status 
            }
        }, { transaction });
    }

    /**
     * Unarchives an objective by setting its status back to a default active state.
     * @param {number} objectiveId The ID of the objective to unarchive.
     * @param {number} userId The ID of the authenticated user.
     * @returns {Promise<object>} The updated objective.
     */
    async unarchiveObjective(objectiveId, userId) {
        // La transacción asegura que todas las operaciones se completen o ninguna lo haga.
        const transaction = await db.sequelize.transaction();
        try {
            const objective = await objectiveRepository.findById(objectiveId, userId, { transaction });
            
            if (!objective) {
                console.error(`[SERVICE] ERROR: Objetivo ${objectiveId} no encontrado.`); // LOG 2
                throw new AppError('Objetivo no encontrado o no tienes permiso.', 404);
            }


            if (objective.status !== 'ARCHIVED') {
                console.error('[SERVICE] ERROR: El objetivo no está archivado.');
                throw new AppError('Este objetivo no está archivado.', 400);
            }

            const newStatus = objective.previousStatus || 'PENDING';
            // Actualizamos el estado del objetivo
            await objective.update({ status: newStatus, previousStatus: null }, { transaction });

            const objectiveAfterUpdate = await objectiveRepository.findById(objectiveId, userId, { transaction });
            console.log(`[SERVICE] Estado después de 'update': ${objectiveAfterUpdate.status}`);
            // Creamos un registro de esta actividad
            await ActivityLog.create({
                userId,
                objectiveId: objective.id,
                activityType: 'OBJECTIVE_UNARCHIVED',
                descriptionKey: 'activityLog.objectiveUnarchived',
                additionalDetails: { objectiveName: objective.name }
            }, { transaction });

            await transaction.commit();
            
            const finalObjective = await this.getObjectiveById(objective.id, userId);
            console.log(`[SERVICE] Desarchivado completado. Estado final: ${finalObjective.status}`); // LOG 7

            return finalObjective;

        } catch (error) {
            await transaction.rollback();
            // Re-lanzamos el error para que sea capturado por el manejador global
            if (error instanceof AppError) throw error;
            throw new AppError('Error al desarchivar el objetivo.', 500, error);
        }
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