// backend/src/api/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');
const { createController } = require('../../utils/controllerFactory');

/**
 * Obtiene las estadísticas de resumen para el dashboard.
 */
exports.getDashboardSummary = createController(
    dashboardService.calculateSummaryStats.bind(dashboardService),
    ['userId']
);

/**
 * Obtiene los objetivos modificados recientemente para la vista previa del dashboard.
 */
exports.getRecentObjectives = createController(
    (userId, query) => dashboardService.fetchRecentObjectives(userId, query.limit),
    ['userId', 'query']
);

/**
 * Obtiene las actividades recientes del usuario.
 */
exports.getRecentActivities = createController(
    (userId, query) => dashboardService.fetchRecentActivities(userId, query.limit),
    ['userId', 'query']
);