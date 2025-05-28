const objectiveRepository = require('../repositories/objectivesRepository');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objetivo, Progress } = db.sequelize.models;

function _calculateProgress(initialValue, currentValue, targetValue, esMenorMejor) {
    const numInitial = parseFloat(initialValue);
    const numCurrent = parseFloat(currentValue);
    const numTarget = parseFloat(targetValue);
    if (isNaN(numInitial) || isNaN(numCurrent) || isNaN(numTarget)) return 0;
    if (numTarget === numInitial) return (esMenorMejor ? numCurrent <= numTarget : numCurrent >= numTarget) ? 100 : 0;
    let progress = esMenorMejor ? ((numInitial - numCurrent) / (numInitial - numTarget)) * 100 : ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
}

exports.obtenerTodosLosObjetivos = async (userId) => {
    try {
        const objetivos = await objectiveRepository.findAll(userId);
        return objetivos.map(obj => {
            const objetivoJson = obj.toJSON ? obj.toJSON() : { ...obj };
            objetivoJson.progreso_calculado = _calculateProgress(objetivoJson.valor_inicial_numerico, objetivoJson.valor_actual, objetivoJson.valor_cuantitativo, objetivoJson.es_menor_mejor);
            return objetivoJson;
        });
    } catch (error) {
        throw new AppError('Error al obtener los objetivos del usuario.', 500, error);
    }
};

exports.obtenerObjetivoPorId = async (objectiveId, userId) => {
    try {
        const objetivo = await objectiveRepository.findById(objectiveId, userId, {
            include: [{ model: Progress, as: 'progresos', attributes: ['id_progreso', 'fecha_registro', 'valor_actual', 'comentarios', 'createdAt', 'updatedAt'], order: [['fecha_registro', 'ASC'], ['createdAt', 'ASC']] }]
        });
        if (!objetivo) throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);
        const objetivoJson = objetivo.toJSON ? objetivo.toJSON() : { ...objetivo };
        objetivoJson.progreso_calculado = _calculateProgress(objetivoJson.valor_inicial_numerico, objetivoJson.valor_actual, objetivoJson.valor_cuantitativo, objetivoJson.es_menor_mejor);
        objetivoJson.historial_progreso = (objetivoJson.progresos && Array.isArray(objetivoJson.progresos)) ? objetivoJson.progresos.map(entry => ({ id: entry.id_progreso, date: entry.fecha_registro ? new Date(entry.fecha_registro).toISOString().split('T')[0] : (entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : null), value: parseFloat(entry.valor_actual), notes: entry.comentarios, createdAt: entry.createdAt, updatedAt: entry.updatedAt })) : [];
        return objetivoJson;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener el detalle del objetivo.', 500, error);
    }
};

exports.crearObjetivo = async (objectiveData, userId) => {
    const t = await db.sequelize.transaction();
    try {
        const valorInicialNum = (objectiveData.valor_inicial_numerico !== undefined && objectiveData.valor_inicial_numerico !== null && String(objectiveData.valor_inicial_numerico).trim() !== "") ? parseFloat(objectiveData.valor_inicial_numerico) : null;
        const newObjectiveData = {
            ...objectiveData, id_usuario: userId, valor_actual: valorInicialNum, valor_inicial_numerico: valorInicialNum,
            valor_cuantitativo: (objectiveData.valor_cuantitativo !== undefined && objectiveData.valor_cuantitativo !== null && String(objectiveData.valor_cuantitativo).trim() !== "") ? parseFloat(objectiveData.valor_cuantitativo) : null,
            es_menor_mejor: typeof objectiveData.es_menor_mejor === 'boolean' ? objectiveData.es_menor_mejor : false,
            estado: objectiveData.estado || 'Pendiente',
        };
        const objetivoCreado = await objectiveRepository.create(newObjectiveData, { transaction: t });
        if (newObjectiveData.valor_inicial_numerico !== null) {
            await Progress.create({ id_objetivo: objetivoCreado.id_objetivo, id_usuario: userId, fecha_registro: new Date(), valor_actual: newObjectiveData.valor_inicial_numerico, comentarios: 'Valor inicial del objetivo.' }, { transaction: t });
        }
        await t.commit();
        return this.obtenerObjetivoPorId(objetivoCreado.id_objetivo, userId);
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') throw new AppError(`Error de validación al crear objetivo: ${error.errors.map(e => e.message).join('. ')}`, 400, error.errors);
        throw new AppError('Error al crear el objetivo.', 500, error);
    }
};

exports.actualizarObjetivo = async (objectiveId, userId, objectiveData, progressData) => {
    const t = await db.sequelize.transaction();
    try {
        const objetivoExistente = await Objetivo.findOne({ where: { id_objetivo: objectiveId, id_usuario: userId }, transaction: t });
        if (!objetivoExistente) { await t.rollback(); throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404); }

        const updateFieldsObjective = { ...objectiveData };
        delete updateFieldsObjective.valor_inicial_numerico; delete updateFieldsObjective.id_usuario; delete updateFieldsObjective.id_objetivo;

        let parsedProgressValue;
        if (progressData && progressData.valor_actual !== undefined && progressData.valor_actual !== null) {
            parsedProgressValue = parseFloat(progressData.valor_actual);
            if (isNaN(parsedProgressValue)) { await t.rollback(); throw new AppError('El valor del progreso (progressData.valor_actual) debe ser un número.', 400); }
            updateFieldsObjective.valor_actual = parsedProgressValue;
        } else {
            parsedProgressValue = parseFloat(objetivoExistente.valor_actual);
            if(isNaN(parsedProgressValue)) parsedProgressValue = parseFloat(objetivoExistente.valor_inicial_numerico);
        }

        let newCalculatedStatus = objectiveData.estado || objetivoExistente.estado;
        const numericInitial = parseFloat(objetivoExistente.valor_inicial_numerico);
        const numericTarget = parseFloat(objetivoExistente.valor_cuantitativo);
        const isLowerBetter = objetivoExistente.es_menor_mejor;

        if (!isNaN(numericInitial) && !isNaN(numericTarget) && !isNaN(parsedProgressValue)) {
            let isCompleted = isLowerBetter ? (parsedProgressValue <= numericTarget) : (parsedProgressValue >= numericTarget);
            if (isCompleted) {
                newCalculatedStatus = 'Completado';
            } else {
                if (objetivoExistente.estado === 'Pendiente' || (objectiveData.estado === 'Pendiente' && newCalculatedStatus === 'Pendiente') ) {
                    if (parsedProgressValue !== numericInitial) newCalculatedStatus = 'En progreso';
                } else if (objetivoExistente.estado === 'Completado' || (objectiveData.estado === 'Completado' && newCalculatedStatus === 'Completado')) {
                    newCalculatedStatus = 'En progreso';
                }
            }
        }
        updateFieldsObjective.estado = newCalculatedStatus;

        if (updateFieldsObjective.valor_cuantitativo !== undefined) {
            if (String(updateFieldsObjective.valor_cuantitativo).trim() === '') updateFieldsObjective.valor_cuantitativo = null;
            else {
                const parsedTarget = parseFloat(updateFieldsObjective.valor_cuantitativo);
                if (isNaN(parsedTarget)) { await t.rollback(); throw new AppError("Valor inválido para 'valor_cuantitativo'. Debe ser un número.", 400); }
                updateFieldsObjective.valor_cuantitativo = parsedTarget;
            }
        }
        if (updateFieldsObjective.es_menor_mejor !== undefined) {
            updateFieldsObjective.es_menor_mejor = typeof updateFieldsObjective.es_menor_mejor === 'boolean' ? updateFieldsObjective.es_menor_mejor : (String(updateFieldsObjective.es_menor_mejor).toLowerCase() === 'true');
        }

        if (Object.keys(updateFieldsObjective).length > 0) {
            await objetivoExistente.update(updateFieldsObjective, { transaction: t });
        }

        if (progressData && progressData.valor_actual !== undefined && progressData.valor_actual !== null && !isNaN(parsedProgressValue) ) {
            const progressEntryData = {
                id_objetivo: objectiveId, id_usuario: userId, fecha_registro: new Date(),
                valor_actual: parsedProgressValue, comentarios: progressData.comentarios || null
            };
            await Progress.create(progressEntryData, { transaction: t });
        }

        await t.commit();
        return this.obtenerObjetivoPorId(objectiveId, userId);

    } catch (error) {
        if (t && t.finished !== 'commit' && t.finished !== 'rollback') {
            try { await t.rollback(); } catch (rollbackError) { /* Ignorar errores de rollback secundario */ }
        }
        if (error.name === 'SequelizeValidationError') throw new AppError(`Error de validación al actualizar objetivo: ${error.errors.map(e => e.message).join('. ')}`, 400, error.errors);
        if (error instanceof AppError) throw error;
        throw new AppError('Error interno del servidor al actualizar el objetivo.', 500, error);
    }
};

exports.eliminarObjetivo = async (objectiveId, userId) => {
    try {
        const deletedCount = await objectiveRepository.delete(objectiveId, userId);
        if (deletedCount === 0) throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);
        return { message: `Objetivo con ID ${objectiveId} eliminado exitosamente.` };
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