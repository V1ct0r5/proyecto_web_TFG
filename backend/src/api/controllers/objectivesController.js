// backend/src/api/controllers/objectivesController.js
const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator'); // Asegúrate de tener esta importación si usas validadores aquí
const db = require('../../config/database'); // Necesario para transacciones si no usas middleware

// Controlador para obtener todos los objetivos de un usuario (Ruta protegida)
exports.obtenerObjetivos = async (req, res) => {
    // Asumiendo que el middleware de autenticación ya puso el ID del usuario en req.user
    const userId = req.user;
    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: obtenerObjetivos - userId (auth):', userId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        const objetivos = await objectivesService.obtenerObjetivos(userId, transaction); // <--- Pasar transaction

        // console.log('Controller: obtenerObjetivos - Objetivos encontrados, enviando 200'); // Log de depuración
        res.status(200).json(objetivos); // Status 200 es el predeterminado si no especificas, pero es bueno ser explícito
    } catch (error) {
        console.error('Error al obtener los objetivos:', error); // Log detallado del error interno
        res.status(500).json({ message: error.message || 'Error al obtener los objetivos' }); // Mensaje más genérico para el cliente
    }
};

// Controlador para crear un nuevo objetivo (Ruta protegida)
exports.crearObjetivo = async (req, res) => {
     // Asumiendo que el middleware de autenticación ya puso el ID del usuario en req.user
    const userId = req.user;
     // Los datos del objetivo vienen en el cuerpo de la petición
    const objetivoData = { ...req.body, id_usuario: userId };

    // Asumiendo que el middleware de validación ya manejó validationResult si hay errores.
    // Si la validación se hace *después* de este controlador, debes manejar validationResult aquí.

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: crearObjetivo - userId (auth):', userId, 'data:', objetivoData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        const objetivo = await objectivesService.crearObjetivo(objetivoData, transaction); // <--- Pasar transaction

        // console.log('Controller: crearObjetivo - Objetivo creado, enviando 201'); // Log de depuración
        res.status(201).json(objetivo); // 201 Created

    } catch (error) {
        console.error('Error al crear el objetivo:', error); // Log detallado del error interno
         // Manejo de errores específicos de Sequelize
         if (error.name === 'SequelizeValidationError') {
             // Si el servicio lanzó un error de validación
             return res.status(400).json({ message: error.errors[0].message || 'Error de validación' });
         }
        // Otros errores inesperados
        res.status(500).json({ message: error.message || 'Error interno al crear el objetivo' }); // Mensaje genérico
    }
};

// Controlador para obtener un objetivo por ID (Ruta protegida, solo si pertenece al usuario)
exports.obtenerObjetivoPorId = async (req, res) => {
     // Asumiendo que el middleware de autenticación ya puso el ID del usuario en req.user
    const userId = req.user;
    const objectiveId = req.params.id;

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: obtenerObjetivoPorId - userId (auth):', userId, 'objectiveId (param):', objectiveId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración


    try {
        // Pasa la transacción al servicio. El servicio ya verifica la pertenencia.
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId, transaction); // <--- Pasar transaction

        // console.log('Controller: obtenerObjetivoPorId - Servicio devolvió objetivo:', objetivo ? `Objetivo ID ${objetivo.id_objetivo}` : 'null'); // Log de depuración

        if (objetivo) {
             // console.log('Controller: obtenerObjetivoPorId - Objetivo encontrado y pertenece, enviando 200'); // Log de depuración
            res.status(200).json(objetivo); // Status 200 OK
        } else {
             // Si el servicio devuelve null, es que no existe O no pertenece al usuario
             console.log('Controller: obtenerObjetivoPorId - Objetivo no encontrado o no pertenece (404)'); // Log de depuración
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al obtener el objetivo por ID:', error); // Log detallado del error interno
        res.status(500).json({ message: error.message || 'Error al obtener el objetivo' }); // Mensaje genérico
    }
};

// Controlador para actualizar un objetivo (Ruta protegida, solo si pertenece al usuario)
exports.actualizarObjetivo = async (req, res) => {
     // Asumiendo que el middleware de autenticación ya puso el ID del usuario en req.user
    const userId = req.user;
    const objectiveId = req.params.id;
     // Los datos actualizados vienen en el cuerpo de la petición
    const updatedData = req.body;

    // Asumiendo que el middleware de validación ya manejó validationResult si hay errores.

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: actualizarObjetivo - userId (auth):', userId, 'objectiveId (param):', objectiveId, 'data:', updatedData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio. El servicio ya verifica la pertenencia.
        // El servicio devuelve la instancia actualizada o null si no encontró/no pertenecía
        const objetivoActualizado = await objectivesService.actualizarObjetivo(objectiveId, updatedData, userId, transaction); // <--- Pasar transaction

        // console.log('Controller: actualizarObjetivo - Servicio devolvió objetivo:', objetivoActualizado ? `Objetivo ID ${objetivoActualizado.id_objetivo}` : 'null'); // Log de depuración


        if (objetivoActualizado) {
             // console.log('Controller: actualizarObjetivo - Objetivo actualizado, enviando 200'); // Log de depuración
            res.status(200).json(objetivoActualizado); // Status 200 OK
        } else {
             // Si el servicio devuelve null, es que no existe O no pertenece al usuario
             console.log('Controller: actualizarObjetivo - Objetivo no encontrado o no pertenece (404)'); // Log de depuración
             res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al actualizar el objetivo:', error); // Log detallado del error interno
         // Manejo de errores específicos de Sequelize
         if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ message: error.errors[0].message || 'Error de validación' });
         }
        // Otros errores inesperados
        res.status(500).json({ message: error.message || 'Error interno al actualizar el objetivo' }); // Mensaje genérico
    }
};

// Controlador para eliminar un objetivo (Ruta protegida, solo si pertenece al usuario)
exports.eliminarObjetivo = async (req, res) => {
     // Asumiendo que el middleware de autenticación ya puso el ID del usuario en req.user
    const userId = req.user;
    const objectiveId = req.params.id;

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: eliminarObjetivo - userId (auth):', userId, 'objectiveId (param):', objectiveId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio. El servicio ya verifica la pertenencia y devuelve 0 o 1.
        const deletedCount = await objectivesService.eliminarObjetivo(objectiveId, userId, transaction); // <--- Pasar transaction

        // console.log('Controller: eliminarObjetivo - Servicio devolvió deletedCount:', deletedCount); // Log de depuración


        if (deletedCount > 0) { // Si es 1, fue exitoso
             // console.log('Controller: eliminarObjetivo - Objetivo eliminado, enviando 204'); // Log de depuración
             res.status(204).send(); // 204 No Content
        } else { // Si es 0, no se encontró o no pertenece
             console.log('Controller: eliminarObjetivo - Objetivo no encontrado o no pertenece (404)'); // Log de depuración
             res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al eliminar el objetivo:', error); // Log detallado del error interno
        res.status(500).json({ message: error.message || 'Error al eliminar el objetivo' }); // Mensaje genérico
    }
};