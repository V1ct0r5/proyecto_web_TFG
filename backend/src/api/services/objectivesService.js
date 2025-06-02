const objectiveRepository = require('../repositories/objectivesRepository');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objetivo, Progress, ActivityLog } = db.sequelize.models;

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

exports.crearObjetivo = async (objectiveData, userId, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const valorInicialNum = (objectiveData.valor_inicial_numerico !== undefined && objectiveData.valor_inicial_numerico !== null && String(objectiveData.valor_inicial_numerico).trim() !== "") ? parseFloat(objectiveData.valor_inicial_numerico) : null;
        const newObjectiveData = {
            ...objectiveData, id_usuario: userId, valor_actual: valorInicialNum, valor_inicial_numerico: valorInicialNum,
            valor_cuantitativo: (objectiveData.valor_cuantitativo !== undefined && objectiveData.valor_cuantitativo !== null && String(objectiveData.valor_cuantitativo).trim() !== "") ? parseFloat(objectiveData.valor_cuantitativo) : null,
            es_menor_mejor: typeof objectiveData.es_menor_mejor === 'boolean' ? objectiveData.es_menor_mejor : false,
            estado: objectiveData.estado || 'Pendiente',
        };
        const objetivoCreado = await objectiveRepository.create(newObjectiveData, { transaction });
        if (newObjectiveData.valor_inicial_numerico !== null) {
            await Progress.create({ id_objetivo: objetivoCreado.id_objetivo, id_usuario: userId, fecha_registro: new Date(), valor_actual: newObjectiveData.valor_inicial_numerico, comentarios: 'Valor inicial del objetivo.' }, { transaction });
        }
        await ActivityLog.create({
            id_usuario: userId, id_objetivo: objetivoCreado.id_objetivo, tipo_actividad: 'OBJECTIVE_CREATED',
            descripcion: `Nuevo objetivo '${objetivoCreado.nombre}' creado.`
        }, { transaction });
        return objetivoCreado;
    };

    if (t_externa) {
        const objetivoCreado = await operacionConTransaccion(t_externa);
        return this.obtenerObjetivoPorId(objetivoCreado.id_objetivo, userId);
    } else {
        const t_local = await db.sequelize.transaction();
        try {
            const objetivoCreado = await operacionConTransaccion(t_local);
            await t_local.commit();
            return this.obtenerObjetivoPorId(objetivoCreado.id_objetivo, userId);
        } catch (error) {
            if (t_local && t_local.finished !== 'commit' && t_local.finished !== 'rollback') await t_local.rollback();
            if (error.name === 'SequelizeValidationError') throw new AppError(`Error de validación al crear objetivo: ${error.errors.map(e => e.message).join('. ')}`, 400, error.errors);
            throw new AppError('Error al crear el objetivo.', 500, error);
        }
    }
};

exports.actualizarObjetivo = async (objectiveId, userId, objectiveData, progressData, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const objetivoExistente = await Objetivo.findOne({ where: { id_objetivo: objectiveId, id_usuario: userId }, transaction });
        if (!objetivoExistente) throw new AppError('Objetivo no encontrado o no pertenece al usuario.', 404);

        const updateFieldsObjective = {};
        const estadoOriginal = objetivoExistente.estado;
        const nombreOriginalObjetivo = objetivoExistente.nombre; // Capturar nombre antes de posible cambio

        if (objectiveData) {
            if (typeof objectiveData.estado === 'string') updateFieldsObjective.estado = objectiveData.estado;
            ['nombre', 'descripcion', 'tipo_objetivo', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida', 'fecha_inicio', 'fecha_fin'].forEach(field => {
                if (objectiveData[field] !== undefined) {
                    if (field === 'valor_cuantitativo') {
                        if (String(objectiveData[field]).trim() === '') updateFieldsObjective[field] = null;
                        else {
                            const parsed = parseFloat(objectiveData[field]);
                            if (isNaN(parsed)) throw new AppError(`Valor inválido para '${field}'. Debe ser un número.`, 400);
                            updateFieldsObjective[field] = parsed;
                        }
                    } else if (field === 'es_menor_mejor') {
                        updateFieldsObjective[field] = typeof objectiveData[field] === 'boolean' ? objectiveData[field] : (String(objectiveData[field]).toLowerCase() === 'true');
                    } else {
                        updateFieldsObjective[field] = objectiveData[field];
                    }
                }
            });
        }

        let parsedProgressValue;
        let valorActualCambiado = false;

        if (progressData && progressData.valor_actual !== undefined && progressData.valor_actual !== null) {
            parsedProgressValue = parseFloat(progressData.valor_actual);
            if (isNaN(parsedProgressValue)) throw new AppError('El valor del progreso (progressData.valor_actual) debe ser un número.', 400);

            const valorActualExistenteNum = parseFloat(objetivoExistente.valor_actual);
            if (isNaN(valorActualExistenteNum) || parsedProgressValue !== valorActualExistenteNum) {
                updateFieldsObjective.valor_actual = parsedProgressValue;
                valorActualCambiado = true;
            }
        } else {
            parsedProgressValue = parseFloat(objetivoExistente.valor_actual);
            if (isNaN(parsedProgressValue)) parsedProgressValue = parseFloat(objetivoExistente.valor_inicial_numerico);
        }

        let newCalculatedStatus = updateFieldsObjective.estado || estadoOriginal;
        const numericInitial = parseFloat(objetivoExistente.valor_inicial_numerico);
        const numericTarget = parseFloat(updateFieldsObjective.valor_cuantitativo !== undefined ? updateFieldsObjective.valor_cuantitativo : objetivoExistente.valor_cuantitativo);
        const isLowerBetter = updateFieldsObjective.es_menor_mejor !== undefined ? updateFieldsObjective.es_menor_mejor : objetivoExistente.es_menor_mejor;

        if (!isNaN(numericInitial) && !isNaN(numericTarget) && !isNaN(parsedProgressValue)) {
            let isCompleted = isLowerBetter ? (parsedProgressValue <= numericTarget) : (parsedProgressValue >= numericTarget);
            if (isCompleted) {
                newCalculatedStatus = 'Completado';
            } else {
                if (estadoOriginal === 'Pendiente' && parsedProgressValue !== numericInitial) {
                    newCalculatedStatus = 'En progreso';
                } else if (estadoOriginal === 'Completado') {
                    newCalculatedStatus = 'En progreso';
                }
            }
        }

        if (newCalculatedStatus && newCalculatedStatus !== estadoOriginal) {
            updateFieldsObjective.estado = newCalculatedStatus;
        } else if (!updateFieldsObjective.hasOwnProperty('estado') && newCalculatedStatus) {
            updateFieldsObjective.estado = newCalculatedStatus;
        } else if (!updateFieldsObjective.hasOwnProperty('estado') && !newCalculatedStatus) {
            updateFieldsObjective.estado = estadoOriginal;
        }

        const fieldsToActuallyUpdateForObjectiveModel = {};
        Object.keys(updateFieldsObjective).forEach(key => {
            // Comprobar si el valor es diferente, incluyendo manejo de null/undefined
            if (updateFieldsObjective[key] !== objetivoExistente[key] && 
                !(updateFieldsObjective[key] == null && objetivoExistente[key] == null)) {
                fieldsToActuallyUpdateForObjectiveModel[key] = updateFieldsObjective[key];
            }
        });
        
        if (Object.keys(fieldsToActuallyUpdateForObjectiveModel).length > 0) {
            await objetivoExistente.update(fieldsToActuallyUpdateForObjectiveModel, { transaction });
        }

        if (valorActualCambiado && progressData) {
            const progressEntryData = {
                id_objetivo: objectiveId, id_usuario: userId, fecha_registro: new Date(),
                valor_actual: parsedProgressValue, comentarios: progressData.comentarios || null
            };
            await Progress.create(progressEntryData, { transaction });
            await ActivityLog.create({
                id_usuario: userId, id_objetivo: objectiveId, tipo_actividad: 'PROGRESS_UPDATED',
                descripcion: `Progreso para '${objetivoExistente.nombre}' actualizado a ${parsedProgressValue} ${objetivoExistente.unidad_medida || ''}.`,
                detalles_adicionales: { valor_anterior: parseFloat(objetivoExistente.valor_actual), valor_nuevo: parsedProgressValue, comentarios: progressData.comentarios }
            }, { transaction });
        }
        
        const estadoFinalActualizado = fieldsToActuallyUpdateForObjectiveModel.estado || estadoOriginal;
        if (fieldsToActuallyUpdateForObjectiveModel.hasOwnProperty('estado') && estadoOriginal !== estadoFinalActualizado) {
            await ActivityLog.create({
                id_usuario: userId,
                id_objetivo: objectiveId,
                tipo_actividad: 'OBJECTIVE_STATUS_CHANGED',
                descripcion: `Estado del objetivo "${nombreOriginalObjetivo}" cambiado de "${estadoOriginal}" a "${estadoFinalActualizado}".`,
                detalles_adicionales: {
                    nombre_objetivo: nombreOriginalObjetivo,
                    estado_anterior: estadoOriginal,
                    estado_nuevo: estadoFinalActualizado
                }
            }, { transaction });
        }
    };

    if (t_externa) {
        await operacionConTransaccion(t_externa);
        return this.obtenerObjetivoPorId(objectiveId, userId);
    } else {
        const t_local = await db.sequelize.transaction();
        try {
            await operacionConTransaccion(t_local);
            await t_local.commit();
            return this.obtenerObjetivoPorId(objectiveId, userId);
        } catch (error) {
            if (t_local && t_local.finished !== 'commit' && t_local.finished !== 'rollback') await t_local.rollback();
            if (error.name === 'SequelizeValidationError') throw new AppError(`Error de validación al actualizar objetivo: ${error.errors.map(e => e.message).join('. ')}`, 400, error.errors);
            if (error instanceof AppError) throw error;
            throw new AppError('Error interno del servidor al actualizar el objetivo.', 500, error);
        }
    }
};

exports.eliminarObjetivo = async (objectiveId, userId, t_externa = null) => {
    const operacionConTransaccion = async (transaction) => {
        const objetivoAEliminar = await Objetivo.findOne({ where: { id_objetivo: objectiveId, id_usuario: userId }, attributes: ['nombre'], transaction });
        if (!objetivoAEliminar) throw new AppError('Objetivo no encontrado o no pertenece al usuario para eliminar.', 404);
        
        const nombreObjetivoEliminado = objetivoAEliminar.nombre;
        // Primero registrar la actividad, luego eliminar.
        await ActivityLog.create({ id_usuario: userId, id_objetivo: objectiveId, tipo_actividad: 'OBJECTIVE_DELETED', descripcion: `Objetivo '${nombreObjetivoEliminado}' eliminado.`}, { transaction });
        
        const deletedCount = await objectiveRepository.delete(objectiveId, userId, { transaction });
        // La comprobación deletedCount === 0 aquí podría ser redundante si findOne ya confirmó existencia,
        // pero se mantiene como una doble verificación.
        if (deletedCount === 0) throw new AppError('No se pudo eliminar el objetivo después de ser encontrado; esto no debería ocurrir.', 500); 
        
        return { message: `Objetivo '${nombreObjetivoEliminado}' eliminado exitosamente.` };
    };

    if (t_externa) {
        return await operacionConTransaccion(t_externa);
    } else {
        const t_local = await db.sequelize.transaction();
        try {
            const resultado = await operacionConTransaccion(t_local);
            await t_local.commit();
            return resultado;
        } catch (error) {
            if (t_local && t_local.finished !== 'commit' && t_local.finished !== 'rollback') await t_local.rollback();
            if (error instanceof AppError) throw error;
            throw new AppError('Error al eliminar el objetivo.', 500, error);
        }
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