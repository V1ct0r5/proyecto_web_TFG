// backend/src/api/controllers/objectivesController.js
const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const ensureUserId = (req, next) => {
    const userId = req.user.id;
    if (!userId) {
        const err = new AppError('Error de autenticación: ID de usuario no encontrado.', 401);
        if (typeof next === 'function') next(err);
        else throw err;
        return null;
    }
    return userId;
};

exports.obtenerObjetivos = async (req, res, next) => {
    const userId = ensureUserId(req, next);
    if (!userId) return;
    try {
        // --- CORRECCIÓN: Pasa el objeto de filtros (req.query) al servicio ---
        const objetivos = await objectivesService.obtenerTodosLosObjetivos(userId, req.query);
        res.status(200).json(objetivos);
    } catch (error) { 
        next(error); 
    }
};

exports.crearObjetivo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const userId = ensureUserId(req, next);
    if (!userId) return;
    try {
        const nuevoObjetivo = await objectivesService.crearObjetivo(req.body, userId, req.transaction);
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
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const userId = ensureUserId(req, next);
    if (!userId) return;

    const { id: objectiveId } = req.params;
    const { progressData, ...objectiveData } = req.body;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(
            objectiveId, userId, objectiveData, progressData, req.transaction
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
        const resultado = await objectivesService.eliminarObjetivo(objectiveId, userId, req.transaction);
        res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};