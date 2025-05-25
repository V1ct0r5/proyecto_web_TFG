// backend/src/api/services/objectivesService.js
const objectiveRepository = require('../repositories/objectivesRepository');
const db = require('../../config/database');

// ¡CAMBIO CRÍTICO AQUÍ!
// Accede a los modelos directamente desde la instancia de Sequelize
// Esto asegura que estás usando los modelos completamente inicializados y asociados.
const { Objetivo, Progress, User } = db.sequelize.models; // Asumo que User también está en db.sequelize.models
// Si tu modelo User no está en db.sequelize.models, solo importa Objetivo y Progress.

const { Op } = require('sequelize'); // Op es útil para queries complejos, asegúrate si lo usas o quítalo.

/**
 * Función auxiliar privada para calcular el progreso de un objetivo.
 * @param {number} initialValue El valor inicial del objetivo.
 * @param {number} currentValue El valor actual del objetivo.
 * @param {number} targetValue El valor meta del objetivo (valor_cuantitativo).
 * @param {boolean} esMenorMejor Indica si un valor más bajo es mejor (ej. tiempo, coste).
 * @returns {number} El progreso calculado en porcentaje (0-100).
 */
function _calculateProgress(initialValue, currentValue, targetValue, esMenorMejor) {
    // Manejo de valores nulos o no numéricos para evitar errores de cálculo
    if (initialValue === null || initialValue === undefined || isNaN(initialValue) ||
        currentValue === null || currentValue === undefined || isNaN(currentValue) ||
        targetValue === null || targetValue === undefined || isNaN(targetValue)) {
        return 0; // Si falta algún valor, el progreso es 0 o un valor por defecto.
    }

    let progress = 0;

    if (esMenorMejor) {
        // Para objetivos donde un valor más bajo es mejor (ej. reducir peso de 100 a 70)
        // Rango: 100 - 70 = 30
        // Progreso actual: 100 - valor_actual
        const range = initialValue - targetValue;
        const currentProgress = initialValue - currentValue;

        if (range === 0) {
            // Si el objetivo es igual al inicio (ej. bajar de 50 a 50),
            // es 100% si el valor actual ya está en o por debajo del objetivo.
            progress = (currentValue <= targetValue) ? 100 : 0;
        } else {
            progress = (currentProgress / range) * 100;
        }
    } else {
        // Para objetivos donde un valor más alto es mejor (ej. aumentar dinero de 50 a 100)
        // Rango: 100 - 50 = 50
        // Progreso actual: valor_actual - 50
        const range = targetValue - initialValue;
        const currentProgress = currentValue - initialValue;

        if (range === 0) {
            // Si el objetivo es igual al inicio (ej. subir de 50 a 50),
            // es 100% si el valor actual ya está en o por encima del objetivo.
            progress = (currentValue >= targetValue) ? 100 : 0;
        } else {
            progress = (currentProgress / range) * 100;
        }
    }
    // Asegurarse de que el progreso esté entre 0 y 100
    return Math.max(0, Math.min(100, progress));
}

/**
 * Función auxiliar privada para normalizar y validar valores numéricos y de fecha.
 * @param {object} data El objeto de datos del objetivo.
 * @returns {object} Los datos del objetivo normalizados.
 * @throws {Error} Si algún valor numérico no es un número válido (después de trim).
 */
function _normalizeObjectiveValues(data) {
    const normalizedData = { ...data };

    ['valor_cuantitativo', 'valor_inicial_numerico', 'valor_actual'].forEach(field => {
        if (normalizedData[field] === '') {
            normalizedData[field] = null;
        } else if (typeof normalizedData[field] === 'string') {
            console.log(`[Backend] _normalizeObjectiveValues: Procesando campo ${field}. Valor original: '${normalizedData[field]}'`);

            const valueWithDot = normalizedData[field].replace(',', '.');

            const parsedValue = parseFloat(valueWithDot);

            console.log(`[Backend] _normalizeObjectiveValues: Campo ${field}. Valor parseado: ${parsedValue}. Tipo: ${typeof parsedValue}`);

            if (isNaN(parsedValue)) {
                throw new Error(`El campo '${field}' proporcionado no es un número válido.`);
            }
            normalizedData[field] = parsedValue;
        }
    });

    // Procesar campos de fecha
    ['fecha_inicio', 'fecha_fin'].forEach(field => {
        if (normalizedData[field] && typeof normalizedData[field] === 'string') {
            normalizedData[field] = new Date(normalizedData[field]);
        } else if (normalizedData[field] === '') {
            normalizedData[field] = null;
        }
    });

    // Asegurarse de que `es_menor_mejor` es un booleano
    if (typeof normalizedData.es_menor_mejor !== 'boolean') {
        normalizedData.es_menor_mejor = (normalizedData.es_menor_mejor === true || normalizedData.es_menor_mejor === 'true');
    }

    return normalizedData;
}


// Función para obtener todos los objetivos de un usuario
exports.obtenerObjetivos = async (userId) => {
    try {
        return await objectiveRepository.findAll(userId);
    } catch (error) {
        console.error(`[ObjectivesService] Error al obtener objetivos para el usuario ${userId}:`, error);
        throw error;
    }
};

// Función para crear un nuevo objetivo
exports.crearObjetivo = async (objetivoData) => {
    try {
        let normalizedData = _normalizeObjectiveValues(objetivoData);

        if (!normalizedData.estado || normalizedData.estado === '') {
            normalizedData.estado = 'Pendiente';
        }

        let nuevoObjetivo;

        await db.sequelize.transaction(async (t) => {
            if (normalizedData.valor_inicial_numerico !== null && normalizedData.valor_cuantitativo !== null) {
                const progressAtCreation = _calculateProgress(
                    normalizedData.valor_inicial_numerico,
                    normalizedData.valor_actual !== null ? normalizedData.valor_actual : normalizedData.valor_inicial_numerico,
                    normalizedData.valor_cuantitativo,
                    normalizedData.es_menor_mejor
                );

                if (progressAtCreation >= 100) {
                    normalizedData.estado = 'Completado';
                } else if (progressAtCreation > 0 && normalizedData.estado === 'Pendiente') {
                    normalizedData.estado = 'En progreso';
                }
            }

            nuevoObjetivo = await objectiveRepository.create(normalizedData, { transaction: t });

            if (nuevoObjetivo.valor_inicial_numerico !== null && nuevoObjetivo.valor_cuantitativo !== null && nuevoObjetivo.id_objetivo) {
                await Progress.create({
                    id_objetivo: nuevoObjetivo.id_objetivo,
                    id_usuario: nuevoObjetivo.id_usuario,
                    fecha_registro: new Date(),
                    valor_actual: parseFloat(nuevoObjetivo.valor_inicial_numerico),
                    comentarios: 'Valor inicial del objetivo'
                }, { transaction: t });
            }
        });

        return nuevoObjetivo;
    } catch (error) {
        console.error('[ObjectivesService] Error al crear objetivo:', error);
        throw error;
    }
};

// Función para obtener un objetivo específico por ID para el usuario autenticado
exports.obtenerObjetivoPorId = async (objectiveId, userId) => {
    try {
        console.log(`[SERVICE] Fetching objective ${objectiveId} for user ${userId} with include options...`);
        // Incluir el historial de progreso y ordenarlo por fecha
        const objective = await objectiveRepository.findById(objectiveId, userId, {
            include: [{
                model: Progress, // Asegúrate de que 'Progress' aquí es el modelo de Sequelize
                as: 'progresos', // Usa el alias 'progresos' definido en Objetivo.js
                attributes: ['fecha_registro', 'valor_actual'], // Solo trae los campos necesarios para la gráfica
                order: [['fecha_registro', 'ASC']] // Ordena los registros por fecha ascendente
            }]
        });

        console.log('[SERVICE] Objective fetched from repository:', objective ? objective.toJSON() : null);

        if (objective) {
            console.log('[SERVICE] Raw progresos received (before transformation):', objective.progresos && Array.isArray(objective.progresos) ? objective.progresos.map(p => p.toJSON()) : 'No progresos array or empty.');

            // Adaptar los datos del historial de progreso al formato esperado por el frontend
            // El frontend espera { date: 'ISO String', value: number }
            if (objective.progresos && Array.isArray(objective.progresos)) {
                objective.dataValues.historial_progreso = objective.progresos.map(entry => ({
                    date: entry.fecha_registro ? new Date(entry.fecha_registro).toISOString() : null, // Asegura formato ISO
                    value: parseFloat(entry.valor_actual) // Asegurar que el valor es numérico (float)
                }));
                console.log('[SERVICE] Transformed historial_progreso (sent to frontend):', objective.dataValues.historial_progreso);

            } else {
                console.log('[SERVICE] No progresos found or not an array for objective ' + objectiveId);

                // Si no hay historial, se inicializa a un array vacío para evitar 'undefined' en el frontend
                objective.dataValues.historial_progreso = [];
            }
            // Opcional: Elimina la propiedad 'progresos' si no quieres enviarla tal cual al frontend
            // ya que ya la has transformado en 'historial_progreso'
            delete objective.dataValues.progresos;
        }
        return objective;
    } catch (error) {
        console.error(`[ObjectivesService] Error al obtener objetivo ${objectiveId} para el usuario ${userId}:`, error);
        throw error;
    }
};

// Función para actualizar un objetivo específico por ID para el usuario autenticado
exports.actualizarObjetivo = async (objectiveId, userId, updatedData) => {
    try {
        // 1. Obtener el objetivo actual de la base de datos
        // Necesitamos el valor_inicial_numerico, valor_actual y es_menor_mejor ORIGINALES
        const existingObjective = await objectiveRepository.findById(objectiveId, userId);

        if (!existingObjective) {
            throw new Error('Objetivo no encontrado para la actualización.');
        }

        // 2. Normalizar los valores de la data a actualizar
        const normalizedData = _normalizeObjectiveValues(updatedData);

        // Asegurarse de que valor_inicial_numerico NO se actualice aquí.
        // El valor inicial solo se establece al crear el objetivo y no debe ser modificable.
        if (normalizedData.valor_inicial_numerico !== undefined) {
            delete normalizedData.valor_inicial_numerico;
        }

        // 3. Lógica de estado automático basada en el progreso
        // Esto solo aplica si hay un valor_actual, valor_cuantitativo (meta) y un valor_inicial_numerico
        // válido en el objetivo existente, Y el objetivo es cuantitativo.
        const isQuantitative = existingObjective.valor_cuantitativo !== null;

        if (isQuantitative &&
            normalizedData.valor_actual !== null && // Hay un nuevo valor actual
            existingObjective.valor_inicial_numerico !== null && // Existe un valor inicial en la DB
            (normalizedData.valor_cuantitativo !== null || existingObjective.valor_cuantitativo !== null) && // Hay un valor cuantitativo (actualizado o el original)
            !isNaN(normalizedData.valor_actual) &&
            !isNaN(existingObjective.valor_inicial_numerico) &&
            !isNaN(normalizedData.valor_cuantitativo || existingObjective.valor_cuantitativo) &&
            !['Completado', 'Archivado', 'Fallido'].includes(normalizedData.estado) // Si el usuario no ha puesto un estado final manualmente
        ) {
            const initial = parseFloat(existingObjective.valor_inicial_numerico);
            const current = parseFloat(normalizedData.valor_actual);
            // Usa el valor cuantitativo actualizado si se envía, de lo contrario, el existente de la DB
            const target = parseFloat(normalizedData.valor_cuantitativo !== null ? normalizedData.valor_cuantitativo : existingObjective.valor_cuantitativo);
            const esMenorMejor = existingObjective.es_menor_mejor;

            const calculatedProgress = _calculateProgress(initial, current, target, esMenorMejor);

            if (calculatedProgress >= 100) {
                normalizedData.estado = 'Completado';
            } else if (calculatedProgress > 0 && normalizedData.estado === 'Pendiente') {
                normalizedData.estado = 'En progreso';
            }
        }

        let updatedRowsCount; // Para almacenar el resultado de la actualización
        await db.sequelize.transaction(async (t) => {
            // Realizar la actualización en la base de datos
            updatedRowsCount = await objectiveRepository.update(objectiveId, userId, normalizedData, { transaction: t });

            // Si se actualizó el objetivo Y el valor actual ha cambiado Y es un objetivo cuantitativo,
            // entonces registra un nuevo punto en el historial de progreso.
            // Es crucial comparar los valores como floats debido al tipo DECIMAL de Sequelize.
            if (updatedRowsCount > 0 &&
                isQuantitative &&
                parseFloat(normalizedData.valor_actual) !== parseFloat(existingObjective.valor_actual)
            ) {
                const progressValorActual = parseFloat(normalizedData.valor_actual);
                console.log('[SERVICE] actualizarObjetivo - Datos para Progress.create: id_objetivo:', objectiveId, 'id_usuario:', userId, 'valor_actual:', progressValorActual, '(tipo:', typeof progressValorActual, ')');

                await Progress.create({
                    id_objetivo: objectiveId,
                    id_usuario: userId,
                    fecha_registro: new Date(),
                    valor_actual: progressValorActual, // Usar la variable ya parseada
                    comentarios: 'Actualización de progreso'
                }, { transaction: t });
            }
        });

        if (updatedRowsCount > 0) {
            // Vuelve a obtener el objetivo con su historial actualizado para la respuesta
            // Esto es importante porque la transacción anterior solo actualiza el objetivo,
            // pero no incluye el historial de progreso recién añadido.
            return this.obtenerObjetivoPorId(objectiveId, userId);
        } else {
            return null; // Si no se actualizó ninguna fila, devuelve null
        }

    } catch (error) {
        console.error(`[ObjectivesService] Error al actualizar objetivo ${objectiveId}:`, error);
        throw error;
    }
};

// Función para eliminar un objetivo específico por ID para el usuario autenticado
exports.eliminarObjetivo = async (objectiveId, userId) => {
    try {
        // Con onDelete: 'CASCADE' en las asociaciones de Sequelize,
        // la eliminación del objetivo padre también eliminará todos los registros de progreso asociados.
        return await objectiveRepository.delete(objectiveId, userId);
    } catch (error) {
        console.error(`[ObjectivesService] Error al eliminar objetivo ${objectiveId}:`, error);
        throw error;
    }
};