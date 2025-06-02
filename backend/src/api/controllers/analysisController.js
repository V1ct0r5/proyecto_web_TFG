const analysisService = require('../services/analysisService');
const AppError = require('../../utils/AppError');

// Funciones para la "Vista General"
exports.getSummaryStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const summary = await analysisService.getAnalysisSummaryStats(userId, period);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

exports.getCategoryDistribution = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const distribution = await analysisService.getCategoryDistribution(userId, period);
        res.status(200).json(distribution);
    } catch (error) {
        next(error);
    }
};

exports.getObjectiveStatusDistribution = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const distribution = await analysisService.getObjectiveStatusDistribution(userId, period);
        res.status(200).json(distribution);
    } catch (error) {
        next(error);
    }
};

exports.getMonthlyProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const progress = await analysisService.getMonthlyProgressByCategory(userId, period);
        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

// Nuevas funciones para análisis avanzado
exports.getObjectivesProgressData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const data = await analysisService.getObjectivesProgressData(userId, period);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.getRankedObjectives = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        const sort = req.query.sort || 'top';
        const limit = parseInt(req.query.limit, 10) || 5;
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const data = await analysisService.getRankedObjectives(userId, period, sort, limit);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.getCategoryAverageProgressData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const data = await analysisService.getCategoryAverageProgress(userId, period);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.getDetailedObjectivesByCategory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '3months';
        if (!userId) return next(new AppError('Usuario no autenticado.', 401));
        const data = await analysisService.getDetailedObjectivesByCategory(userId, period);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};