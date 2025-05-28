const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const ensureUserId = (req, next) => {
    const userId = req.user.id;
    if (!userId) {
        next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
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
        const nuevoObjetivo = await objectivesService.crearObjetivo(objectiveData, userId);
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

    const { estado, progressData /*, ...otrosCamposDelObjetivo */ } = req.body; // otrosCamposDelObjetivo no se usa en la versión "después"

    const objectiveDataForService = {
        estado,
    };
    const progressDataForService = progressData;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(
            objectiveId,
            userId,
            objectiveDataForService,
            progressDataForService
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
        await objectivesService.eliminarObjetivo(objectiveId, userId);
        res.status(204).send();
    } catch (error) { next(error); }
};