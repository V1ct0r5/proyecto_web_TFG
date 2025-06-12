// backend/src/api/controllers/objectivesController.js
const objectivesService = require('../services/objectivesService');
const AppError = require('../../utils/AppError');

/**
 * Utility function to get the authenticated user ID from the request object.
 * @param {object} req - The Express request object.
 * @returns {number} The user ID.
 * @throws {AppError} If the user ID is not found.
 */
const getAuthUserId = (req) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError('Error de autenticación: ID de usuario no encontrado.', 401);
    }
    return userId;
};

/**
 * Handles the request to get all objectives for a user, with filtering.
 */
exports.getObjectives = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        // req.query contiene todos los filtros (searchTerm, category, sortBy, etc.)
        const objectives = await objectivesService.getAllObjectives(userId, req.query);
        res.status(200).json({
            status: 'success',
            results: objectives.length,
            data: { objectives }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the request to get a single objective by its ID.
 */
exports.getObjectiveById = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        const { id: objectiveId } = req.params;
        const objective = await objectivesService.getObjectiveById(objectiveId, userId);
        res.status(200).json({
            status: 'success',
            data: { objective }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the request to create a new objective.
 */
exports.createObjective = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        const newObjective = await objectivesService.createObjective(req.body, userId);
        res.status(201).json({
            status: 'success',
            data: { objective: newObjective }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the request to update an existing objective.
 */
exports.updateObjective = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        const { id: objectiveId } = req.params;
        const updatedObjective = await objectivesService.updateObjective(objectiveId, userId, req.body);
        res.status(200).json({
            status: 'success',
            data: { objective: updatedObjective }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the request to delete an objective.
 */
exports.deleteObjective = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        const { id: objectiveId } = req.params;
        await objectivesService.deleteObjective(objectiveId, userId);
        res.status(204).json(); // No Content
    } catch (error) {
        next(error);
    }
};