// backend/src/api/controllers/analysisController.js
const analysisService = require('../services/analysisService');
const { createController } = require('../../utils/controllerFactory');

exports.getSummary = createController(
    (userId, query) => analysisService.getAnalysisSummary(userId, query.period),
    ['userId', 'query']
);

exports.getCategoryDistribution = createController(
    (userId, query) => analysisService.getCategoryDistribution(userId, query.period),
    ['userId', 'query']
);

exports.getObjectiveStatusDistribution = createController(
    (userId, query) => analysisService.getObjectiveStatusDistribution(userId, query.period),
    ['userId', 'query']
);

exports.getMonthlyProgress = createController(
    (userId, query) => analysisService.getMonthlyProgress(userId, query.period),
    ['userId', 'query']
);

exports.getRankedObjectives = createController(
    (userId, query) => analysisService.getRankedObjectives(userId, query.period, query.limit),
    ['userId', 'query']
);

exports.getCategoryAverageProgress = createController(
    (userId, query) => analysisService.getCategoryAverageProgress(userId, query.period),
    ['userId', 'query']
);

exports.getDetailedObjectivesByCategory = createController(
    (userId, query) => analysisService.getDetailedObjectivesByCategory(userId, query.period),
    ['userId', 'query']
);

// NUEVO: Controlador añadido para el gráfico de progreso por objetivo.
exports.getObjectivesProgressChartData = createController(
    (userId, query) => analysisService.getObjectivesProgressChartData(userId, query.period),
    ['userId', 'query']
);