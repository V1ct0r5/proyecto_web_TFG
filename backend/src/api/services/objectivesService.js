// backend/src/api/services/objectivesService.js
const objectiveRepository = require('../repositories/objectivesRepository');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objetivo, Progress, ActivityLog } = db.sequelize.models;

const statusToKey = (name) => {
    const map = {
        'En progreso': 'status.inProgress',
        'Completado': 'status.completed',
        'Pendiente': 'status.pending',
        'Fallido': 'status.failed',
        'Archivado': 'status.archived',
        'No Iniciado': 'status.notStarted'
    };
    return map[name] || `status.${name.toLowerCase().replace(/\s/g, '')}`;
};

function _calculateProgress(initialValue, currentValue, targetValue, esMenorMejor) {
    const numInitial = parseFloat(initialValue);
    const numCurrent = parseFloat(currentValue);
    const numTarget = parseFloat(targetValue);
    if (isNaN(numInitial) || isNaN(numCurrent) || isNaN(numTarget)) return 0;
    if (numTarget === numInitial) return (esMenorMejor ? numCurrent <= numTarget : numCurrent >= numTarget) ? 100 : 0;
    let progress = esMenorMejor ? ((numInitial - numCurrent) / (numInitial - numTarget)) * 100 : ((numCurrent - numInitial) / (numTarget - numInitial)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
}

const checkAndUpdateOverdueStatus = (objectiveJson) => {
    const deadline = objectiveJson.fecha_fin ? new Date(objectiveJson.fecha_fin) : null;
    const isOverdue = deadline && deadline < new Date() && objectiveJson.estado !== 'Completado' && objectiveJson.estado !== 'Archivado';

    if (isOverdue) {
        objectiveJson.estado = 'Fallido';
        objectiveJson.estadoKey = statusToKey('Fallido');
    }
    return objectiveJson;
};

exports.obtenerTodosLosObjetivos = async (userId, filters = {}) => {
    try {
        const objetivos = await objectiveRepository.findAll(userId, filters);
        
        let processedObjetivos = objetivos.map(obj => {
            let objetivoJson = obj.toJSON ? obj.toJSON() : { ...obj };
            objetivoJson.progreso_calculado = _calculateProgress(objetivoJson.valor_inicial_numerico, objetivoJson.valor_actual, objetivoJson.valor_cuantitativo, objetivoJson.es_menor_mejor);
            objetivoJson.estadoKey = statusToKey(objetivoJson.estado);
            
            objetivoJson = checkAndUpdateOverdueStatus(objetivoJson);

            return objetivoJson;
        });

        // Ordenar por progreso después de haberlo calculado
        if (filters.sortBy === 'progressAsc') {
            processedObjetivos.sort((a, b) => (a.progreso_calculado ?? 0) - (b.progreso_calculado ?? 0));
        } else if (filters.sortBy === 'progressDesc') {
            processedObjetivos.sort((a, b) => (b.progreso_calculado ?? 0) - (a.progreso_calculado ?? 0));
        }
        
        return processedObjetivos;

    } catch (error) {
        throw new AppError('Error al obtener los objetivos del usuario.', 500, error);
    }
};

exports.obtenerObjetivoPorId = async (objectiveId, userId) => {
    try {
        const objetivo = await objectiveRepository.findById(objectiveId, userId, {
            include: [{ model: Progress, as: 'progresos', attributes: ['id_progreso', 'fecha_registro', 'valor_actual', 'comentarios', 'createdAt', 'updatedAt'], order: [['fecha_registro', 'ASC'], ['createdAt', 'ASC']] }]
        });
        if (!objetivo) throw new AppError('Objetivo no encontrado.', 404);

        let objetivoJson = objetivo.toJSON ? objetivo.toJSON() : { ...objetivo };
        objetivoJson.progreso_calculado = _calculateProgress(objetivoJson.valor_inicial_numerico, objetivoJson.valor_actual, objetivoJson.valor_cuantitativo, objetivoJson.es_menor_mejor);
        objetivoJson.estadoKey = statusToKey(objetivoJson.estado);
        
        objetivoJson = checkAndUpdateOverdueStatus(objetivoJson);

        objetivoJson.historial_progreso = (objetivoJson.progresos || []).map(entry => ({ id: entry.id_progreso, date: entry.fecha_registro ? new Date(entry.fecha_registro).toISOString().split('T')[0] : (entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : null), value: parseFloat(entry.valor_actual), notes: entry.comentarios, createdAt: entry.createdAt, updatedAt: entry.updatedAt }));
        return objetivoJson;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener el detalle del objetivo.', 500, error);
    }
};

exports.crearObjetivo = async (objectiveData, userId, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const valorInicialNum = (objectiveData.valor_inicial_numerico !== undefined && objectiveData.valor_inicial_numerico !== null && String(objectiveData.valor_inicial_numerico).trim() !== "") ? parseFloat(objectiveData.valor_inicial_numerico) : null;
        const newObjectiveData = {
            ...objectiveData, id_usuario: userId, valor_actual: valorInicialNum, valor_inicial_numerico: valorInicialNum,
            valor_cuantitativo: (objectiveData.valor_cuantitativo !== undefined && objectiveData.valor_cuantitativo !== null && String(objectiveData.valor_cuantitativo).trim() !== "") ? parseFloat(objectiveData.valor_cuantitativo) : null,
            es_menor_mejor: !!objectiveData.es_menor_mejor,
            estado: objectiveData.estado || 'Pendiente',
        };
        const objetivoCreado = await objectiveRepository.create(newObjectiveData, { transaction });
        if (newObjectiveData.valor_inicial_numerico !== null) {
            await Progress.create({ id_objetivo: objetivoCreado.id_objetivo, id_usuario: userId, fecha_registro: new Date(), valor_actual: newObjectiveData.valor_inicial_numerico, comentarios: 'Valor inicial del objetivo.' }, { transaction });
        }
        await ActivityLog.create({ id_usuario: userId, id_objetivo: objetivoCreado.id_objetivo, tipo_actividad: 'OBJECTIVE_CREATED', descripcion: 'activityLog.objectiveCreated', detalles_adicionales: { objectiveName: objetivoCreado.nombre } }, { transaction });
        return objetivoCreado;
    };
    if (t_externa) return operacionConTransaccion(t_externa);
    const t_local = await db.sequelize.transaction();
    try {
        const objetivoCreado = await operacionConTransaccion(t_local);
        await t_local.commit();
        return this.obtenerObjetivoPorId(objetivoCreado.id_objetivo, userId);
    } catch (error) {
        if (t_local && !t_local.finished) await t_local.rollback();
        if (error.name === 'SequelizeValidationError') throw new AppError(`Error de validación: ${error.errors.map(e => e.message).join('. ')}`, 400, error.errors);
        throw new AppError('Error al crear el objetivo.', 500, error);
    }
};

exports.actualizarObjetivo = async (objectiveId, userId, objectiveData, progressData, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const objetivoExistente = await Objetivo.findOne({ where: { id_objetivo: objectiveId, id_usuario: userId }, transaction });
        if (!objetivoExistente) throw new AppError('Objetivo no encontrado.', 404);

        const estadoOriginal = objetivoExistente.estado;
        const nombreOriginalObjetivo = objetivoExistente.nombre;
        const updateFieldsObjective = { ...objectiveData };

        let parsedProgressValue;
        let valorActualCambiado = false;
        const valorNuevoPotencial = (progressData?.valor_actual !== undefined) ? progressData.valor_actual : (objectiveData?.valor_actual);

        if (valorNuevoPotencial !== undefined && valorNuevoPotencial !== null) {
            parsedProgressValue = parseFloat(valorNuevoPotencial);
            if (isNaN(parsedProgressValue)) throw new AppError('El valor del progreso debe ser un número.', 400);

            if (parsedProgressValue !== parseFloat(objetivoExistente.valor_actual)) {
                updateFieldsObjective.valor_actual = parsedProgressValue;
                valorActualCambiado = true;
            }
        }

        if (Object.keys(updateFieldsObjective).length > 0) {
            await objetivoExistente.update(updateFieldsObjective, { transaction });
        }
        
        if (valorActualCambiado) {
            await Progress.create({ id_objetivo: objectiveId, id_usuario: userId, fecha_registro: new Date(), valor_actual: parsedProgressValue, comentarios: progressData?.comentarios || null }, { transaction });
            await ActivityLog.create({ id_usuario: userId, id_objetivo: objectiveId, tipo_actividad: 'PROGRESS_UPDATED', descripcion: 'activityLog.progressUpdated', detalles_adicionales: { objectiveName: nombreOriginalObjetivo, newValue: parsedProgressValue, unit: objetivoExistente.unidad_medida || '' } }, { transaction });
        }
        
        const estadoFinalActualizado = objetivoExistente.estado;
        if (estadoOriginal !== estadoFinalActualizado) {
            await ActivityLog.create({ id_usuario: userId, id_objetivo: objectiveId, tipo_actividad: 'OBJECTIVE_STATUS_CHANGED', descripcion: 'activityLog.statusChanged', detalles_adicionales: { objectiveName: nombreOriginalObjetivo, oldStatusKey: statusToKey(estadoOriginal), newStatusKey: statusToKey(estadoFinalActualizado) } }, { transaction });
        }
    };
    if (t_externa) return operacionConTransaccion(t_externa);
    const t_local = await db.sequelize.transaction();
    try {
        await operacionConTransaccion(t_local);
        await t_local.commit();
        return this.obtenerObjetivoPorId(objectiveId, userId);
    } catch (error) {
        if (t_local && !t_local.finished) await t_local.rollback();
        if (error instanceof AppError) throw error;
        throw new AppError('Error interno al actualizar el objetivo.', 500, error);
    }
};

exports.eliminarObjetivo = async (objectiveId, userId, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const objetivoAEliminar = await Objetivo.findOne({ where: { id_objetivo: objectiveId, id_usuario: userId }, attributes: ['nombre'], transaction });
        if (!objetivoAEliminar) throw new AppError('Objetivo no encontrado.', 404);
        
        const nombreObjetivoEliminado = objetivoAEliminar.nombre;
        await ActivityLog.create({ id_usuario: userId, id_objetivo: objectiveId, tipo_actividad: 'OBJECTIVE_DELETED', descripcion: 'activityLog.objectiveDeleted', detalles_adicionales: { objectiveName: nombreObjetivoEliminado } }, { transaction });
        await objectiveRepository.delete(objectiveId, userId, { transaction });
        return { message: `Objetivo '${nombreObjetivoEliminado}' eliminado.` };
    };
    if (t_externa) return await operacionConTransaccion(t_externa);
    const t_local = await db.sequelize.transaction();
    try {
        const resultado = await operacionConTransaccion(t_local);
        await t_local.commit();
        return resultado;
    } catch (error) {
        if (t_local && !t_local.finished) await t_local.rollback();
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