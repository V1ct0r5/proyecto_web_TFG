const db = require('../../config/database');
const { Usuario, Objetivo, Progress, ActivityLog } = db.sequelize.models; // Importa los modelos que necesites
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { _calculateProgress } = require('./objectivesService'); // Asumiendo que exportas _calculateProgress
const fs = require('fs').promises;
const path = require('path');

exports.fetchUserProfile = async (userId) => {
    try {
        const user = await Usuario.findByPk(userId, {
            attributes: [
                'id',
                'nombre_usuario',
                'correo_electronico',
                'createdAt',
                'telefono',
                'ubicacion',
                'biografia',
                'avatar_url'
            ]
        });
        if (!user) {
            throw new AppError('Perfil de usuario no encontrado.', 404);
        }
        return {
            id: user.id,
            name: user.nombre_usuario,
            email: user.correo_electronico,
            memberSince: user.createdAt,
            status: 'Activo', // Esto podría venir de otro campo o lógica
            location: user.ubicacion || null,
            phone: user.telefono || null,
            bio: user.biografia || '',
            avatarUrl: user.avatar_url || null,
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener los detalles del perfil.', 500, error);
    }
};

exports.fetchUserStats = async (userId) => {
    try {
        const totalObjectives = await Objetivo.count({ where: { id_usuario: userId } });
        const completed = await Objetivo.count({ where: { id_usuario: userId, estado: 'Completado' } });
        const inProgress = await Objetivo.count({ where: { id_usuario: userId, estado: 'En progreso' } });
        
        const quantitativeObjectives = await Objetivo.findAll({
            where: { 
                id_usuario: userId, 
                valor_cuantitativo: { [Op.ne]: null }, 
                valor_inicial_numerico: { [Op.ne]: null },
                estado: { [Op.notIn]: ['Archivado', 'Fallido'] }
            }
        });
        
        let averageProgress = 0;
        if (quantitativeObjectives.length > 0) {
            const totalProgressSum = quantitativeObjectives.reduce((sum, obj) => {
                // En un caso real, importa o reimplementa _calculateProgress de forma robusta.
                const progress = (typeof _calculateProgress === 'function') 
                    ? _calculateProgress(obj) 
                    : (parseFloat(obj.valor_actual || 0) / parseFloat(obj.valor_cuantitativo || 1) * 100 || 0);
                return sum + Math.max(0, Math.min(100, progress));
            }, 0);
            averageProgress = Math.round(totalProgressSum / quantitativeObjectives.length);
        }
        
        const successRate = totalObjectives > 0 ? Math.round((completed / totalObjectives) * 100) : 0;

        return {
            totalObjectives,
            completed,
            inProgress,
            successRate,
            // averageProgress: averageProgress, // Descomenta si lo necesitas
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener las estadísticas del perfil.', 500, error);
    }
};

exports.fetchUserAchievements = async (userId) => {
    try {
        const achievements = [];
        const completedObjectives = await Objetivo.count({ where: { id_usuario: userId, estado: 'Completado' } });

        if (completedObjectives > 0) {
            achievements.push({ id: 'ach1_completed_first', text: 'Primer Objetivo Completado' });
        }
        if (completedObjectives >= 10) {
            achievements.push({ id: 'ach2_completed_10', text: '10 Objetivos Completados' });
        }
        // Ejemplo para racha (requeriría lógica más compleja)
        // const streak = await calculateStreak(userId);
        // if (streak >= 7) {
        //   achievements.push({ id: 'ach3_streak_7', text: `Racha de ${streak} días` });
        // }
        return achievements; 
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener los logros del perfil.', 500, error);
    }
};

exports.updateUserProfile = async (userId, profileData) => {
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar.', 404);
        }

        const allowedUpdates = {};
        const updatableFields = ['nombre_usuario', 'correo_electronico', 'telefono', 'sitio_web', 'biografia', 'ubicacion'];
        
        updatableFields.forEach(field => {
            if (profileData[field] !== undefined) {
                allowedUpdates[field] = profileData[field];
            }
        });

        await user.update(allowedUpdates);
        return {
            id: user.id,
            name: user.nombre_usuario,
            email: user.correo_electronico,
            memberSince: user.createdAt,
            status: 'Activo', 
            location: user.ubicacion,
            phone: user.telefono,
            website: user.sitio_web,
            bio: user.biografia,
            avatarUrl: user.avatar_url,
        };
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join('. ');
            throw new AppError(`Error de validación: ${messages}`, 400, error.errors);
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar el perfil.', 500, error);
    }
};

exports.updateAvatarUrl = async (userId, newAvatarUrl, newAvatarDiskPath) => {
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            if (newAvatarDiskPath) {
                await fs.unlink(newAvatarDiskPath).catch(e => console.error("Error eliminando archivo huérfano (usuario no encontrado):", e.message));
            }
            throw new AppError('Usuario no encontrado para actualizar avatar.', 404);
        }

        const oldAvatarUrl = user.avatar_url;

        user.avatar_url = newAvatarUrl;
        await user.save();

        if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
            try {
                if (oldAvatarUrl.includes('/uploads/avatars/')) {
                    const oldFileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf('/') + 1);
                    const oldAvatarFullPath = path.resolve(__dirname, '../../../public/uploads/avatars', oldFileName);
                    
                    if (await fs.stat(oldAvatarFullPath).then(() => true).catch(() => false)) {
                        await fs.unlink(oldAvatarFullPath);
                    } else {
                        // Opcional: Loggear si el archivo antiguo no se encontró, pero no es un error crítico.
                        // console.warn(`[Service] Archivo de avatar antiguo no encontrado en disco para eliminar: ${oldAvatarFullPath}`);
                    }
                }
            } catch (e) {
                // No detener el proceso principal si falla la eliminación del archivo antiguo, pero sí loggearlo si se configura un logger.
                // console.error("[Service] Error eliminando avatar antiguo del sistema de archivos:", e.message);
            }
        }
        return { avatarUrl: user.avatar_url };
    } catch (error) {
        if (newAvatarDiskPath) {
             await fs.unlink(newAvatarDiskPath).catch(e => console.error("[Service] Error eliminando archivo subido (newAvatarDiskPath) tras fallo de BD:", e.message));
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar la URL del avatar en la base de datos.', 500, error);
    }
};