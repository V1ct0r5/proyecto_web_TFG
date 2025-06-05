// backend/src/api/controllers/profileController.js
const profileService = require('../services/profileService');
const AppError = require('../../utils/AppError');
const path = require('path'); // Asegúrate de importar 'path'

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

        // --- INICIO DE MODIFICACIÓN PARA REFORZAR SEGURIDAD ---
        // Aunque uploadMiddleware.js genera un nombre seguro (ej. user-${id}-avatar-${sufijo}.${ext}),
        // aplicamos path.basename() como una capa adicional de sanitización para asegurarnos
        // de que solo el componente final del nombre de archivo se utiliza.
        // Esto previene que cualquier posible carácter de ruta ('/' o '\') inesperado en req.file.filename
        // (aunque no debería haberlo si el middleware funciona bien) afecte la construcción de relativePath.
        const safeFilenameComponent = path.basename(req.file.filename);

        // Adicionalmente, una comprobación explícita contra '..' en el componente de nombre de archivo.
        // De nuevo, esto debería ser redundante si uploadMiddleware es correcto, pero no hace daño.
        if (safeFilenameComponent.includes('..')) {
            console.warn(`[ProfileController] Intento de Path Traversal detectado en nombre de archivo (ya procesado por basename): ${safeFilenameComponent}`);
            // Considerar limpiar el archivo subido si se detecta un intento así.
            // Por ahora, simplemente denegamos la operación.
            // await fs.promises.unlink(req.file.path).catch(e => console.error("Error eliminando archivo sospechoso:", e));
            return next(new AppError('Nombre de archivo para avatar inválido.', 400));
        }
        // --- FIN DE MODIFICACIÓN PARA REFORZAR SEGURIDAD ---

        const relativePath = `/uploads/avatars/${safeFilenameComponent}`; // Usar el nombre de archivo sanitizado
        
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        // relativePath ya debería empezar con '/'
        const avatarUrl = `${cleanBaseUrl}${relativePath}`;
        
        // req.file.path es la ruta temporal del NUEVO archivo subido, gestionada por Multer.
        // La vulnerabilidad de Path Traversal que Snyk probablemente señaló
        // se aborda principalmente en profileService.updateAvatarUrl al manejar
        // la eliminación del AVATAR ANTIGUO.
        const updatedUser = await profileService.updateAvatarUrl(userId, avatarUrl, req.file.path);

        res.status(200).json({
            message: 'Foto de perfil actualizada con éxito.',
            avatarUrl: updatedUser.avatarUrl 
        });
    } catch (error) {
        // Si hay un error y se subió un archivo temporal, Multer usualmente no lo limpia
        // si el error ocurre después de que Multer haya terminado. Considerar limpieza aquí o en el servicio.
        // Sin embargo, si el error es por 'Nombre de archivo inválido', ya no se llama al servicio.
        if (req.file && req.file.path && error.message !== 'Nombre de archivo inválido.') {
            // fs.promises.unlink(req.file.path).catch(e => console.error("Error eliminando archivo temporal tras fallo en uploadAvatar:", e));
            // Comentado para evitar introducir un nuevo fs.unlink aquí sin la misma lógica de seguridad que se aplica en el servicio.
            // La limpieza de archivos temporales de Multer en caso de error post-subida es un tema complejo.
        }
        next(error);
    }
};