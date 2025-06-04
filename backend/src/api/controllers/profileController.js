const profileService = require('../services/profileService');
const AppError = require('../../utils/AppError');
// const { validationResult } = require('express-validator'); // Descomenta si añades validadores

exports.getProfileDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado para obtener perfil.', 401));
        }
        const profileData = await profileService.fetchUserProfile(userId);
        res.status(200).json(profileData);
    } catch (error) {
        next(error);
    }
};

exports.getProfileStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado para obtener estadísticas.', 401));
        }
        const statsData = await profileService.fetchUserStats(userId);
        res.status(200).json(statsData);
    } catch (error) {
        next(error);
    }
};

exports.getProfileAchievements = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado para obtener logros.', 401));
        }
        const achievementsData = await profileService.fetchUserAchievements(userId);
        res.status(200).json(achievementsData);
    } catch (error) {
        next(error);
    }
};

exports.updateProfileDetails = async (req, res, next) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }
    try {
        const userId = req.user.id;
        if (!userId) {
            return next(new AppError('Usuario no autenticado para actualizar perfil.', 401));
        }
        const profileDataToUpdate = req.body;
        const updatedProfile = await profileService.updateUserProfile(userId, profileDataToUpdate);
        res.status(200).json(updatedProfile);
    } catch (error) {
        next(error);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return next(new AppError('No se seleccionó ningún archivo para subir.', 400));
        }

        // Construir la URL pública del avatar
        const relativePath = `/uploads/avatars/${req.file.filename}`;
        
        // Determinar la URL base del backend
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanRelativePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

        const avatarUrl = `${cleanBaseUrl}${cleanRelativePath}`;
        
        const updatedUser = await profileService.updateAvatarUrl(userId, avatarUrl, req.file.path);

        res.status(200).json({
            message: 'Foto de perfil actualizada con éxito.',
            avatarUrl: updatedUser.avatarUrl 
        });
    } catch (error) {
        next(error);
    }
};