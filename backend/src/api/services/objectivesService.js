// backend/src/api/services/objectivesService.js
const objectiveRepository = require('../repositories/objectivesRepository');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objetivo, Progress } = db.sequelize.models;

/**
 * Calcula el progreso de un objetivo.
 * @param {number | string | null} initialValue
 * @param {number | string | null} currentValue
 * @param {number | string | null} targetValue
 * @param {boolean} esMenorMejor
 * @returns {number} Progreso en porcentaje (0-100).
 */
function _calculateProgress(initialValue, currentValue, targetValue, esMenorMejor) {
    const numInitial = parseFloat(initialValue);
    const numCurrent = parseFloat(currentValue);
    const numTarget = parseFloat(targetValue);

    if (isNaN(numInitial) || isNaN(numCurrent) || isNaN(numTarget)) {
        return 0;
    }
    if (numTarget === numInitial) {
        return numCurrent === numTarget ? 100 : 0;
    }
    let progress;
    if (esMenorMejor) {
        progress = ((numInitial - numCurrent) / (numInitial - numTarget)) * 100;
    } else {
        progress = ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;
    }
    return Math.max(0, Math.min(100, Math.round(progress)));
}

exports.obtenerTodosLosObjetivos = async (userId) => {
    try {
        const objetivos = await objectiveRepository.findAll(userId);
        return objetivos.map(obj => {
            const objetivoJson = obj.toJSON ? obj.toJSON() : { ...obj };
            objetivoJson.progreso_calculado = _calculateProgress(
                objetivoJson.valor_inicial_numerico,
                objetivoJson.valor_actual,
                objetivoJson.valor_cuantitativo,
                objetivoJson.es_menor_mejor
            );
            return objetivoJson;
        });
    } catch (error) {
        throw new AppError('Error al obtener los objetivos del usuario.', 500, error);
    }
};

exports.obtenerObjetivoPorId = async (objectiveId, userId) => {
    try {
        const objetivo = await objectiveRepository.findById(objectiveId, userId, {
            include: [{
                model: Progress,
                as: 'progresos',
                attributes: ['fecha_registro', 'valor_actual'],
                order: [['fecha_registro', 'ASC']]
            }]
        });

        if (!objetivo) {
            throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);
        }
        
        const objetivoJson = objetivo.toJSON ? objetivo.toJSON() : { ...objetivo };
        objetivoJson.progreso_calculado = _calculateProgress(
            objetivoJson.valor_inicial_numerico,
            objetivoJson.valor_actual,
            objetivoJson.valor_cuantitativo,
            objetivoJson.es_menor_mejor
        );
        
        if (objetivoJson.progresos && Array.isArray(objetivoJson.progresos)) {
            objetivoJson.historial_progreso = objetivoJson.progresos.map(entry => ({
                date: entry.fecha_registro ? new Date(entry.fecha_registro).toISOString() : null,
                value: parseFloat(entry.valor_actual)
            }));
        } else {
            objetivoJson.historial_progreso = [];
        }
        delete objetivoJson.progresos;

        return objetivoJson;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener el objetivo.', 500, error);
    }
};

exports.crearObjetivo = async (objectiveData, userId) => {
    const t = await db.sequelize.transaction();
    try {
        const valorInicialNum = (objectiveData.valor_inicial_numerico !== undefined && objectiveData.valor_inicial_numerico !== null) 
                                ? parseFloat(objectiveData.valor_inicial_numerico) 
                                : 0; // Default si no se provee o es inválido

        const valorActualParaCreacion = (objectiveData.valor_actual !== undefined && objectiveData.valor_actual !== null)
                                      ? parseFloat(objectiveData.valor_actual)
                                      : valorInicialNum;


        const newObjectiveData = {
            ...objectiveData,
            id_usuario: userId,
            valor_actual: valorActualParaCreacion,
            valor_inicial_numerico: (objectiveData.valor_inicial_numerico !== undefined && objectiveData.valor_inicial_numerico !== null) ? parseFloat(objectiveData.valor_inicial_numerico) : null,
            valor_cuantitativo: (objectiveData.valor_cuantitativo !== undefined && objectiveData.valor_cuantitativo !== null) ? parseFloat(objectiveData.valor_cuantitativo) : null,
            es_menor_mejor: typeof objectiveData.es_menor_mejor === 'boolean' ? objectiveData.es_menor_mejor : false,
            estado: objectiveData.estado || 'Pendiente',
        };

        const objetivoCreado = await objectiveRepository.create(newObjectiveData, { transaction: t });

        if (newObjectiveData.valor_inicial_numerico !== null) {
            await Progress.create({
                id_objetivo: objetivoCreado.id_objetivo,
                id_usuario: userId,
                fecha_registro: new Date(),
                valor_actual: newObjectiveData.valor_inicial_numerico,
                comentarios: 'Valor inicial del objetivo.'
            }, { transaction: t });
        }
        await t.commit();
        return this.obtenerObjetivoPorId(objetivoCreado.id_objetivo, userId);
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message).join('. ');
            throw new AppError(`Error de validación al crear objetivo: ${messages}`, 400, error.errors);
        }
        throw new AppError('Error al crear el objetivo.', 500, error);
    }
};

exports.actualizarObjetivo = async (objectiveId, userId, objectiveData, progressData) => {
    const t = await db.sequelize.transaction();
    try {
        const objetivoExistente = await Objetivo.findOne({
            where: { id_objetivo: objectiveId, id_usuario: userId },
            transaction: t 
        });

        if (!objetivoExistente) {
            await t.rollback();
            throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);
        }
        
        const updateFields = { ...objectiveData };
        delete updateFields.valor_inicial_numerico; // No se puede modificar
        delete updateFields.id_usuario;           // No se puede modificar

        if (progressData && progressData.valor_actual !== undefined && progressData.valor_actual !== null) {
            updateFields.valor_actual = parseFloat(progressData.valor_actual);
        }

        ['valor_cuantitativo', 'valor_actual'].forEach(field => {
            if (updateFields[field] !== undefined && updateFields[field] !== null && updateFields[field] !== '') {
                const parsed = parseFloat(updateFields[field]);
                if (isNaN(parsed)) throw new AppError(`Valor inválido para ${field}.`, 400);
                updateFields[field] = parsed;
            } else if (updateFields[field] === '') {
                 updateFields[field] = null;
            }
        });
        if (updateFields.es_menor_mejor !== undefined) {
            updateFields.es_menor_mejor = typeof updateFields.es_menor_mejor === 'boolean' ? updateFields.es_menor_mejor : (String(updateFields.es_menor_mejor).toLowerCase() === 'true');
        }

        await Objetivo.update(updateFields, {
            where: { id_objetivo: objectiveId, id_usuario: userId },
            transaction: t
        });

        if (progressData && progressData.valor_actual !== undefined && progressData.valor_actual !== null ) {
            const valorProgreso = parseFloat(progressData.valor_actual);
            if (!isNaN(valorProgreso)) {
                await Progress.create({
                    id_objetivo: objectiveId,
                    id_usuario: userId,
                    fecha_registro: new Date(),
                    valor_actual: valorProgreso,
                    comentarios: progressData.comentarios || 'Actualización de progreso.'
                }, { transaction: t });
            }
        }
        
        await t.commit();
        return this.obtenerObjetivoPorId(objectiveId, userId);
        
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message).join('. ');
            throw new AppError(`Error de validación al actualizar objetivo: ${messages}`, 400, error.errors);
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar el objetivo.', 500, error);
    }
};

exports.eliminarObjetivo = async (objectiveId, userId) => {
    try {
        const deletedCount = await objectiveRepository.delete(objectiveId, userId);
        if (deletedCount === 0) {
            throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);
        }
        return { message: `Objetivo con ID ${objectiveId} eliminado.`, count: deletedCount };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al eliminar el objetivo.', 500, error);
    }
};

exports.usuarioTieneObjetivos = async (userId) => {
    try {
        const count = await Objetivo.count({ where: { id_usuario: userId } });
        return count > 0;
    } catch (error) {
        throw new AppError('Error al verificar si el usuario tiene objetivos.', 500, error);
    }
};

module.exports = exports;