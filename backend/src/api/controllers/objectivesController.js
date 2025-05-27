// backend/src/api/controllers/objectivesController.js
const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
// const db = require('../../config/database'); // No se usa directamente, se elimina
const AppError = require('../../utils/AppError'); // Para manejo de errores de validación, si se opta por ello

exports.obtenerObjetivos = async (req, res, next) => {
    const userId = req.user.id; // Se asume que req.user.id es poblado por authMiddleware

    try {
        // Llamada a la función renombrada en el servicio
        const objetivos = await objectivesService.obtenerTodosLosObjetivos(userId); 
        res.status(200).json(objetivos);
    } catch (error) {
        next(error); // Delegar todos los errores al errorHandler global
    }
};

exports.crearObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Devolver errores de express-validator directamente
        return res.status(400).json({ errors: errors.array() });
        // Alternativa: return next(new AppError('Errores de validación.', 400, errors.array()));
    }

    const userId = req.user.id;
    const objectiveData = req.body;

    try {
        const nuevoObjetivo = await objectivesService.crearObjetivo(objectiveData, userId);
        // El servicio ya debería lanzar AppError si hay problemas (ej. validación de BD, conflicto)
        res.status(201).json(nuevoObjetivo);
    } catch (error) {
        next(error); // Delegar al errorHandler
    }
};

exports.obtenerObjetivoPorId = async (req, res, next) => {
    const userId = req.user.id;
    const { id: objectiveId } = req.params; // Usar desestructuración para claridad

    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId);
        // El servicio objectivesService.obtenerObjetivoPorId ya lanza AppError con 404 si no se encuentra.
        res.status(200).json(objetivo);
    } catch (error) {
        next(error);
    }
};

exports.actualizarObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        // Alternativa: return next(new AppError('Errores de validación.', 400, errors.array()));
    }

    const userId = req.user.id;
    const { id: objectiveId } = req.params;
    // Separar datos del objetivo de los datos de progreso
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
        // El servicio objectivesService.actualizarObjetivo ya maneja errores 404 y de validación/conflicto.
        res.status(200).json(objetivoActualizado);
    } catch (error) {
        next(error);
    }
};

exports.eliminarObjetivo = async (req, res, next) => {
    const userId = req.user.id;
    const { id: objectiveId } = req.params;

    try {
        await objectivesService.eliminarObjetivo(objectiveId, userId);
        // El servicio objectivesService.eliminarObjetivo ya lanza AppError con 404 si no se encuentra.
        res.status(204).send(); // No Content
    } catch (error) {
        next(error);
    }
};