const objectiveRepository = require('../repositories/objectivesRepository'); // Importa el repositorio
const { Op } = require('sequelize'); // Todavía necesario para operadores de Sequelize


/**
 * Función auxiliar privada para normalizar y validar valores numéricos y de fecha.
 * Esto ayuda a evitar la duplicación de código en crearObjetivo y actualizarObjetivo.
 * @param {object} data El objeto de datos del objetivo.
 * @returns {object} Los datos del objetivo normalizados.
 * @throws {Error} Si algún valor numérico no es válido.
 */
function _normalizeObjectiveValues(data) {
    // Normalizar valor_cuantitativo
    if (data.valor_cuantitativo === '') {
        data.valor_cuantitativo = null;
    } else if (data.valor_cuantitativo !== undefined && typeof data.valor_cuantitativo === 'string') {
        const parsedValue = parseFloat(data.valor_cuantitativo);
        if (isNaN(parsedValue)) {
            throw new Error('El valor cuantitativo proporcionado no es un número válido.');
        }
        data.valor_cuantitativo = parsedValue;
    }

    // Normalizar valor_actual
    if (data.valor_actual === '') {
        data.valor_actual = null;
    } else if (data.valor_actual !== undefined && typeof data.valor_actual === 'string') {
        const parsedValue = parseFloat(data.valor_actual);
        if (isNaN(parsedValue)) {
            throw new Error('El valor actual proporcionado no es un número válido.');
        }
        data.valor_actual = parsedValue;
    }

    // Las validaciones de fechas (fecha_inicio, fecha_fin) como "mayor que hoy" o "fin > inicio"
    // deberían manejarse primordialmente en el middleware de validación (objectivesValidation.js)
    // para que no lleguen aquí valores no válidos.
    // Aquí solo nos aseguramos de que sean objetos Date si es necesario para el ORM.
    if (data.fecha_inicio && typeof data.fecha_inicio === 'string') {
        data.fecha_inicio = new Date(data.fecha_inicio);
    }
    if (data.fecha_fin && typeof data.fecha_fin === 'string') {
        data.fecha_fin = new Date(data.fecha_fin);
    }

    return data;
}


// Función para obtener todos los objetivos de un usuario
exports.obtenerObjetivos = async (userId) => {
    try {
        return await objectiveRepository.findAll(userId); // Usa el repositorio
    } catch (error) {
        console.error(`[ObjectivesService] Error al obtener objetivos para el usuario ${userId}:`, error);
        throw error;
    }
};

// Función para crear un nuevo objetivo
exports.crearObjetivo = async (objetivoData) => {
    try {
        const normalizedData = _normalizeObjectiveValues(objetivoData);
        const nuevoObjetivo = await objectiveRepository.create(normalizedData);
        return nuevoObjetivo;
    } catch (error) {
        console.error('[ObjectivesService] Error al crear objetivo:', error);
        throw error; // Propagar el error para que el controlador lo maneje
    }
};

// Función para obtener un objetivo por ID
exports.obtenerObjetivoPorId = async (objectiveId, userId) => {
    try {
        return await objectiveRepository.findById(objectiveId, userId); // Usa el repositorio
    } catch (error) {
        console.error(`[ObjectivesService] Error al obtener objetivo ${objectiveId} para el usuario ${userId}:`, error);
        throw error;
    }
};

// Función para actualizar un objetivo
exports.actualizarObjetivo = async (objectiveId, userId, updatedData) => {
    try {
        // Lógica de validación de fechas duplicada en el servicio y middleware
        // Considera si esta validación ya se maneja en el middleware de validación.
        // Si no, asegúrate de que esté aquí.
        if (updatedData.fecha_inicio) {
            const startDate = new Date(updatedData.fecha_inicio);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación
            startDate.setHours(0, 0, 0, 0);
            if (startDate < currentDate) {
                throw new Error('La fecha de inicio no puede ser anterior a la fecha actual.');
            }
        }

        if (updatedData.fecha_fin) {
            const endDate = new Date(updatedData.fecha_fin);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Normalizar a medianoche
            endDate.setHours(0, 0, 0, 0);
            if (endDate < currentDate) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha actual.');
            }
        }

        // Parseo de valores cuantitativos y actuales
        if (updatedData.valor_cuantitativo === '') {
            updatedData.valor_cuantitativo = null;
        } else if (typeof updatedData.valor_cuantitativo === 'string') {
            updatedData.valor_cuantitativo = parseFloat(updatedData.valor_cuantitativo);
            if (isNaN(updatedData.valor_cuantitativo)) {
                throw new Error('Valor cuantitativo no es un número válido.');
            }
        }

        if (updatedData.valor_actual === '') {
            updatedData.valor_actual = null;
        } else if (typeof updatedData.valor_actual === 'string') {
            updatedData.valor_actual = parseFloat(updatedData.valor_actual);
            if (isNaN(updatedData.valor_actual)) {
                throw new Error('Valor actual no es un número válido.');
            }
        }

        return await objectiveRepository.update(objectiveId, userId, updatedData); // Usa el repositorio

    } catch (error) {
        console.error(`[ObjectivesService] Error al actualizar objetivo ${objectiveId}:`, error);
        throw error;
    }
};

// Función para eliminar un objetivo
exports.eliminarObjetivo = async (objectiveId, userId) => {
    try {
        return await objectiveRepository.delete(objectiveId, userId); // Usa el repositorio
    } catch (error) {
        console.error(`[ObjectivesService] Error al eliminar objetivo ${objectiveId}:`, error);
        throw error;
    }
};