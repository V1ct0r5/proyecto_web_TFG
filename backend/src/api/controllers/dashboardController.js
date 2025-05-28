// backend/src/api/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');
const AppError = require('../../utils/AppError'); // Asumiendo que lo usas

exports.getDashboardSummaryStats = async (req, res, next) => {
    try {
        console.log('Dashboard Controller - req.user:', JSON.stringify(req.user, null, 2)); // <--- AÑADE ESTO
        const userId = req.user.id;
        if (!userId) { // <--- AÑADE ESTA VERIFICACIÓN
            console.error('Dashboard Controller - userId es undefined o null');
            return next(new AppError('Error de autenticación: ID de usuario no encontrado en el token.', 401));
        }
        console.log('Dashboard Controller - userId:', userId); // <--- AÑADE ESTO
        const summary = await dashboardService.calculateSummaryStats(userId);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

exports.getRecentObjectivesPreview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit, 10) || 4; // Límite por defecto
        const objectives = await dashboardService.fetchRecentObjectives(userId, limit);
        res.status(200).json(objectives);
    } catch (error) {
        next(error);
    }
};

exports.getRecentActivities = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit, 10) || 5;
        const activities = await dashboardService.fetchRecentActivities(userId, limit);
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};