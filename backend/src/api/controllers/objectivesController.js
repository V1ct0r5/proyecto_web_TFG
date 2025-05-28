// backend/src/api/controllers/objectivesController.js
const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

exports.obtenerObjetivos = async (req, res, next) => {
    // Se asume que req.user.id es poblado por el middleware de autenticación
    const userId = req.user.id; 
    if (!userId) {
        return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
    }

    try {
        const objetivos = await objectivesService.obtenerTodosLosObjetivos(userId); 
        res.status(200).json(objetivos);
    } catch (error) {
        next(error); // Delegar errores al manejador global
    }
};

exports.crearObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Devolver errores de express-validator directamente al cliente
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    if (!userId) {
        return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
    }
    const objectiveData = req.body;

    try {
        const nuevoObjetivo = await objectivesService.crearObjetivo(objectiveData, userId);
        res.status(201).json(nuevoObjetivo);
    } catch (error) {
        next(error);
    }
};

exports.obtenerObjetivoPorId = async (req, res, next) => {
    const userId = req.user.id;
    const { id: objectiveId } = req.params; 
    if (!userId) {
        return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
    }

    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId);
        // El servicio debe lanzar AppError con 404 si el objetivo no se encuentra o no pertenece al usuario.
        res.status(200).json(objetivo);
    } catch (error) {
        next(error);
    }
};

exports.actualizarObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { id: objectiveId } = req.params;
    if (!userId) {
        return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
    }
    
    // Separar datos del objetivo de los datos de progreso para un manejo claro en el servicio
    const { progressValorActual, comentarios_progreso, ...objectiveDataRest } = req.body;
    
    const progressData = (progressValorActual !== undefined && progressValorActual !== null) 
        ? { valor_actual: progressValorActual, comentarios: comentarios_progreso } 
        : undefined;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(
            objectiveId, 
            userId, 
            objectiveDataRest, 
            progressData
        );
        res.status(200).json(objetivoActualizado);
    } catch (error) {
        next(error);
    }
};

exports.eliminarObjetivo = async (req, res, next) => {
    const userId = req.user.id;
    const { id: objectiveId } = req.params;
    if (!userId) {
        return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
    }

    try {
        await objectivesService.eliminarObjetivo(objectiveId, userId);
        // El servicio debe lanzar AppError con 404 si el objetivo no se encuentra o no pertenece al usuario.
        res.status(204).send(); // No Content, indica éxito sin cuerpo de respuesta
    } catch (error) {
        next(error);
    }
};