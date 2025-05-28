// backend/src/api/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');
const AppError = require('../../utils/AppError');

exports.getDashboardSummaryStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Es crucial verificar que el userId exista después de la autenticación
        if (!userId) {
            return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
        }
        const summary = await dashboardService.calculateSummaryStats(userId);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

exports.getRecentObjectivesPreview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) { // Siempre es buena práctica verificar el userId
            return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
        }
        const limit = parseInt(req.query.limit, 10) || 4; // Límite por defecto si no se especifica
        const objectives = await dashboardService.fetchRecentObjectives(userId, limit);
        res.status(200).json(objectives);
    } catch (error) {
        next(error);
    }
};

exports.getRecentActivities = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) { // Verificar userId también aquí
            return next(new AppError('Error de autenticación: ID de usuario no encontrado.', 401));
        }
        const limit = parseInt(req.query.limit, 10) || 5; // Límite por defecto
        const activities = await dashboardService.fetchRecentActivities(userId, limit);
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};