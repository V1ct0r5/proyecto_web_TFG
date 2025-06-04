const settingsService = require('../services/settingsService');
const AppError = require('../../utils/AppError');

exports.getSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado.', 401));
        }
        const settings = await settingsService.fetchUserSettings(userId);
        res.status(200).json(settings);
    } catch (error) {
        next(error);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado.', 401));
        }
        const settingsData = req.body;
        const result = await settingsService.updateUserSettings(userId, settingsData);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado.', 401));
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return next(new AppError('Se requieren la contraseña actual y la nueva contraseña.', 400));
        }
        const result = await settingsService.changeUserPassword(userId, currentPassword, newPassword);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.exportUserData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado.', 401));
        }
        const userData = await settingsService.exportAllUserData(userId);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=user_data_${userId}.json`);
        res.status(200).json(userData);
    } catch (error) {
        next(error);
    }
};

exports.deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado.', 401));
        }
        const result = await settingsService.deleteUserAccount(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};