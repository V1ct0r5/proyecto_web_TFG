const objectivesService = require('../services/objectivesService'); // Importa el servicio de objetivos
const { validationResult } = require('express-validator'); // Para manejar resultados de validación
const db = require('../../config/database'); // Importa la instancia de la base de datos y modelos

// Controlador para obtener todos los objetivos del usuario autenticado
exports.obtenerObjetivos = async (req, res) => {
    // El ID del usuario autenticado se espera que venga adjunto al objeto request por un middleware (ej. authMiddleware)
    const userId = req.user;
    // Se asume que un middleware (ej. transactionMiddleware) adjunta la transacción
    // const transaction = req.transaction; // Si usas un middleware de transacción

    try {
        // Llama al servicio para obtener los objetivos del usuario
        // Si usas transacciones a nivel de ruta, pasa la transacción al servicio.
        const objetivos = await objectivesService.obtenerObjetivos(userId /*, transaction*/);

        // Envía la respuesta con los objetivos y status 200 OK
        res.status(200).json(objetivos);
    } catch (error) {
        // Manejo de errores: loguea el error y envía una respuesta con status 500
        console.error('Error al obtener los objetivos:', error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los objetivos' });
    }
};

// Controlador para crear un nuevo objetivo para el usuario autenticado
exports.crearObjetivo = async (req, res) => {
    // Validar los resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         // Si hay errores de validación, envía una respuesta 400 con los detalles
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user; // ID del usuario autenticado
    // Combina los datos del cuerpo de la solicitud con el ID del usuario
    const objetivoData = { ...req.body, id_usuario: userId };

    // const transaction = req.transaction; // Si usas un middleware de transacción

    try {
        // Llama al servicio para crear el objetivo en la base de datos
        const objetivo = await objectivesService.crearObjetivo(objetivoData /*, transaction*/);

        // Envía la respuesta con el objetivo creado y status 201 Created
        res.status(201).json(objetivo);

    } catch (error) {
        // Manejo de errores: loguea el error
        console.error('Error al crear el objetivo:', error);
        // Manejo específico para errores de validación de Sequelize (si ocurren a nivel de modelo)
        if (error.name === 'SequelizeValidationError') {
             // Si es un error de validación de Sequelize, envía 400 con el mensaje
            return res.status(400).json({ message: error.errors[0].message || 'Error de validación de Sequelize' });
        }
        // Para otros errores, envía una respuesta 500
        res.status(500).json({ message: error.message || 'Error interno al crear el objetivo' });
    }
};

// Controlador para obtener un objetivo específico por ID para el usuario autenticado
exports.obtenerObjetivoPorId = async (req, res) => {
    const userId = req.user; // ID del usuario autenticado
    const objectiveId = req.params.id; // ID del objetivo desde los parámetros de la URL

    // const transaction = req.transaction; // Si usas un middleware de transacción

    try {
        // Llama al servicio para obtener el objetivo por ID, asegurando que pertenezca al usuario
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId /*, transaction*/);

        if (objetivo) {
            // Si se encuentra el objetivo y pertenece al usuario, envía la respuesta 200
            res.status(200).json(objetivo);
        } else {
            // Si no se encuentra el objetivo o no pertenece, envía 404 Not Found
            console.log('Controller: obtenerObjetivoPorId - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        // Manejo de errores: loguea y envía 500
        console.error('Error al obtener el objetivo por ID:', error);
        res.status(500).json({ message: error.message || 'Error interno al obtener el objetivo' });
    }
};

// Controlador para actualizar un objetivo específico por ID para el usuario autenticado
exports.actualizarObjetivo = async (req, res) => {
     // Validar los resultados de express-validator para la actualización
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         // Si hay errores de validación, envía una respuesta 400
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user; // ID del usuario autenticado
    const objectiveId = req.params.id; // ID del objetivo desde los parámetros
    // Los datos actualizados vienen en el cuerpo de la solicitud
    const updatedData = req.body;

    // const transaction = req.transaction; // Si usas un middleware de transacción

    try {
        // Llama al servicio para actualizar el objetivo, verificando la pertenencia al usuario
        const objetivoActualizado = await objectivesService.actualizarObjetivo(objectiveId, userId, updatedData /*, transaction*/);

        if (objetivoActualizado) {
            // Si se actualizó el objetivo (y se devuelve el objeto actualizado), envía 200
            res.status(200).json(objetivoActualizado);
        } else {
            // Si no se encontró o no pertenece, envía 404
            console.log('Controller: actualizarObjetivo - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        // Manejo de errores: loguea
        console.error('Error al actualizar el objetivo:', error);
         // Manejo específico para errores de validación de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message || 'Error de validación de Sequelize' });
        }
         // Otros errores, envía 500
        res.status(500).json({ message: error.message || 'Error interno al actualizar el objetivo' });
    }
};

// Controlador para eliminar un objetivo específico por ID para el usuario autenticado
exports.eliminarObjetivo = async (req, res) => {
    const userId = req.user; // ID del usuario autenticado
    const objectiveId = req.params.id; // ID del objetivo desde los parámetros

    // const transaction = req.transaction; // Si usas un middleware de transacción

    try {
        // Llama al servicio para eliminar el objetivo, verificando la pertenencia al usuario
        const deletedCount = await objectivesService.eliminarObjetivo(objectiveId, userId /*, transaction*/);

        if (deletedCount) { // El servicio devuelve true si se eliminó > 0
            // Si se eliminó al menos un registro, envía 204 No Content
            res.status(204).send(); // 204 no debe tener cuerpo de respuesta
        } else {
            // Si no se eliminó ninguno (no encontrado o no pertenece), envía 404
            console.log('Controller: eliminarObjetivo - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        // Manejo de errores: loguea y envía 500
        console.error('Error al eliminar el objetivo:', error);
        res.status(500).json({ message: error.message || 'Error interno al eliminar el objetivo' });
    }
};