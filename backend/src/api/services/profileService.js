// backend/src/services/profileService.js
const db = require('../../config/database');
const { Usuario, Objetivo, Progress, ActivityLog } = db.sequelize.models;
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { _calculateProgress } = require('./objectivesService');
const fs = require('fs').promises;
const path = require('path');

// Definir la ruta base absoluta y segura para el directorio de subidas de avatares
// Asegúrate de que esta ruta coincida con la configuración de tu uploadMiddleware y la estructura de tu proyecto.
// Si profileService.js está en backend/src/api/services/
// y los avatares están en backend/public/uploads/avatars/
const UPLOAD_DIR_ABSOLUTE = path.resolve(__dirname, '../../../../public/uploads/avatars');

exports.fetchUserProfile = async (userId) => {
    try {
        const user = await Usuario.findByPk(userId, {
            attributes: [
                'id', 'nombre_usuario', 'correo_electronico', 'createdAt',
                'telefono', 'ubicacion', 'biografia', 'avatar_url'
            ]
        });
        if (!user) {
            throw new AppError('Perfil de usuario no encontrado.', 404);
        }
        return {
            id: user.id, name: user.nombre_usuario, email: user.correo_electronico,
            memberSince: user.createdAt, status: 'Activo', // Esto podría venir de otro campo o lógica
            location: user.ubicacion || null, phone: user.telefono || null,
            bio: user.biografia || '', avatarUrl: user.avatar_url || null,
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
                const progress = (typeof _calculateProgress === 'function') 
                    ? _calculateProgress(obj) 
                    : (parseFloat(obj.valor_actual || 0) / parseFloat(obj.valor_cuantitativo || 1) * 100 || 0);
                return sum + Math.max(0, Math.min(100, progress));
            }, 0);
            averageProgress = Math.round(totalProgressSum / quantitativeObjectives.length);
        }
        
        const successRate = totalObjectives > 0 ? Math.round((completed / totalObjectives) * 100) : 0;

        return {
            totalObjectives, completed, inProgress, successRate,
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
        // Asegúrate que 'avatar_url' no se pueda actualizar directamente por aquí,
        // ya que tiene su propio flujo en updateAvatarUrl.
        const updatableFields = ['nombre_usuario', 'correo_electronico', 'telefono', 'sitio_web', 'biografia', 'ubicacion'];
        
        updatableFields.forEach(field => {
            if (profileData[field] !== undefined) {
                allowedUpdates[field] = profileData[field];
            }
        });

        await user.update(allowedUpdates);
        return { // Devolver los campos actualizados y relevantes
            id: user.id, name: user.nombre_usuario, email: user.correo_electronico,
            memberSince: user.createdAt, status: 'Activo', 
            location: user.ubicacion, phone: user.telefono,
            website: user.sitio_web, bio: user.biografia,
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
    // newAvatarDiskPath es la ruta temporal del archivo nuevo subido por multer
    // newAvatarUrl es la URL pública que se guardará en la BD para el nuevo avatar
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            // Si el usuario no existe, eliminar el archivo recién subido para no dejar huérfanos
            if (newAvatarDiskPath) {
                await fs.unlink(newAvatarDiskPath).catch(e => console.error("Error eliminando archivo huérfano (usuario no encontrado):", e.message));
            }
            throw new AppError('Usuario no encontrado para actualizar avatar.', 404);
        }

        const oldAvatarUrl = user.avatar_url;

        // Actualizar la URL del avatar en el objeto usuario y guardar en la BD
        user.avatar_url = newAvatarUrl;
        await user.save();

        // Si había una URL de avatar antigua y es diferente de la nueva, intentar eliminar el archivo antiguo del disco
        if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
            try {
                // Solo intentar eliminar si la URL antigua parece ser un archivo local gestionado por nosotros
                if (oldAvatarUrl.includes('/uploads/avatars/')) {
                    let oldFileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf('/') + 1);

                    // --- INICIO DE CORRECCIÓN PARA PATH TRAVERSAL ---
                    // 1. Sanitizar oldFileName para obtener solo el nombre del archivo base.
                    //    Esto previene que caracteres como '../' en oldFileName afecten la ruta.
                    oldFileName = path.basename(oldFileName);

                    // 2. Construir la ruta completa al archivo antiguo usando path.join (más seguro para segmentos)
                    //    y el directorio base absoluto y seguro.
                    const oldAvatarFullPath = path.join(UPLOAD_DIR_ABSOLUTE, oldFileName);

                    // 3. Verificar que la ruta construida esté realmente dentro del directorio de subidas permitido.
                    //    Esto es una capa crucial de seguridad.
                    if (oldAvatarFullPath.startsWith(UPLOAD_DIR_ABSOLUTE + path.sep)) {
                        if (await fs.stat(oldAvatarFullPath).then(() => true).catch(() => false)) {
                            await fs.unlink(oldAvatarFullPath);
                            console.log(`[Service] Avatar antiguo eliminado del disco: ${oldAvatarFullPath}`);
                        } else {
                            console.warn(`[Service] Archivo de avatar antiguo no encontrado en disco para eliminar: ${oldAvatarFullPath}`);
                        }
                    } else {
                        // Si la ruta resuelta está fuera del directorio esperado, es un intento de Path Traversal.
                        console.error(`[Service] Intento de acceso fuera del directorio permitido al intentar eliminar avatar antiguo: ${oldAvatarFullPath}. Operación denegada.`);
                        // No se lanza un error para no interrumpir el flujo de actualización del avatar,
                        // pero se registra el intento malicioso o el error de configuración.
                    }
                    // --- FIN DE CORRECCIÓN PARA PATH TRAVERSAL ---
                } else {
                     console.warn(`[Service] URL de avatar antiguo no sigue el patrón esperado para eliminación gestionada localmente: ${oldAvatarUrl}`);
                }
            } catch (e) {
                // No detener el proceso principal si falla la eliminación del archivo antiguo, pero sí loggearlo.
                console.error("[Service] Error eliminando avatar antiguo del sistema de archivos:", e.message);
            }
        }
        // Devolver solo la nueva URL del avatar, ya que el controlador espera un objeto con esta propiedad.
        return { avatarUrl: user.avatar_url }; 
    } catch (error) {
        // Si hubo un error al actualizar la BD (después de que el archivo ya se subió a una ruta temporal),
        // intentar eliminar el archivo nuevo para no dejarlo huérfano.
        if (newAvatarDiskPath) {
             await fs.unlink(newAvatarDiskPath).catch(e => console.error("[Service] Error eliminando archivo subido (newAvatarDiskPath) tras fallo de BD:", e.message));
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar la URL del avatar en la base de datos.', 500, error);
    }
};