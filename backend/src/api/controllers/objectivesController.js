const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const ensureUserId = (req, next) => {
    const userId = req.user.id;
    if (!userId) {
        if (typeof next === 'function') {
            next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
        } else {
            throw new AppError('Error de autenticación: ID de usuario no encontrado.', 401);
        }
        return null;
    }
    return userId;
};

exports.obtenerObjetivos = async (req, res, next) => {
    const userId = ensureUserId(req, next);
    if (!userId) return;
    try {
        const objetivos = await objectivesService.obtenerTodosLosObjetivos(userId);
        res.status(200).json(objetivos);
    } catch (error) { next(error); }
};

exports.crearObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = ensureUserId(req, next);
    if (!userId) return;

    const objectiveData = req.body;
    try {
        const nuevoObjetivo = await objectivesService.crearObjetivo(
            objectiveData,
            userId,
            req.transaction
        );
        res.status(201).json(nuevoObjetivo);
    } catch (error) { next(error); }
};

exports.obtenerObjetivoPorId = async (req, res, next) => {
    const userId = ensureUserId(req, next);
    if (!userId) return;
    const { id: objectiveId } = req.params;
    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId);
        res.status(200).json(objetivo);
    } catch (error) { next(error); }
};

exports.actualizarObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = ensureUserId(req, next);
    if (!userId) return;

    const { id: objectiveId } = req.params;
    const { estado, progressData, ...otrosCamposDelObjetivo } = req.body;

    const objectiveDataForService = {
        estado,
    };
    // Incluir otros campos permitidos del objetivo para la actualización
    const allowedObjectiveFields = ['nombre', 'descripcion', 'tipo_objetivo', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida', 'fecha_inicio', 'fecha_fin'];
    for (const key in otrosCamposDelObjetivo) {
        if (Object.prototype.hasOwnProperty.call(otrosCamposDelObjetivo, key) &&
            allowedObjectiveFields.includes(key)) {
            objectiveDataForService[key] = otrosCamposDelObjetivo[key];
        }
    }

    const progressDataForService = progressData;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(
            objectiveId,
            userId,
            objectiveDataForService,
            progressDataForService,
            req.transaction
        );
        res.status(200).json(objetivoActualizado);
    } catch (error) {
        next(error);
    }
};

exports.eliminarObjetivo = async (req, res, next) => {
    const userId = ensureUserId(req, next);
    if (!userId) return;

    const { id: objectiveId } = req.params;

    try {
        const resultado = await objectivesService.eliminarObjetivo(
            objectiveId,
            userId,
            req.transaction
        );
        res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};