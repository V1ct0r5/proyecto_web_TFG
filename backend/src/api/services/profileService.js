// backend/src/api/services/profileService.js
const db = require('../../config/database');
const { Usuario, Objetivo, Progress, ActivityLog } = db.sequelize.models; // Importa los modelos que necesites
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');
const { _calculateProgress } = require('./objectivesService'); // Asumiendo que exportas _calculateProgress si lo necesitas aquí
const fs = require('fs').promises;
const path = require('path');

exports.fetchUserProfile = async (userId) => {
    try {
        const user = await Usuario.findByPk(userId, {
            // MODIFICACIÓN CLAVE: Incluir 'avatar_url' en los atributos
            attributes: [
                'id',
                'nombre_usuario',
                'correo_electronico',
                'createdAt',
                'telefono',     // Asegúrate de incluir estos campos si existen en tu modelo Usuario
                'ubicacion',    // y los quieres en el perfil
                'biografia',
                'avatar_url'    // <--- ¡AÑADE ESTO!
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
            location: user.ubicacion || null, // O 'No especificada' si prefieres un string por defecto
            phone: user.telefono || null,
            // website: user.sitio_web || null, // Descomentar si existe y lo usas
            bio: user.biografia || '',
            avatarUrl: user.avatar_url || null, // Usar null si no hay URL, para que no se muestre un string vacío
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
        
        // Para la tasa de éxito y progreso promedio, podrías reutilizar/adaptar lógica de analysisService
        // o calcularla aquí específicamente.
        const quantitativeObjectives = await Objetivo.findAll({
            where: { 
                id_usuario: userId, 
                valor_cuantitativo: { [Op.ne]: null }, 
                valor_inicial_numerico: { [Op.ne]: null },
                estado: { [Op.notIn]: ['Archivado', 'Fallido'] } // Solo considerar para promedio
            }
        });
        
        let averageProgress = 0;
        if (quantitativeObjectives.length > 0) {
            const totalProgressSum = quantitativeObjectives.reduce((sum, obj) => {
                // Necesitas una función _calculateProgress aquí o importarla
                // Asumiré que _calculateProgress de objectivesService puede ser accedida o replicada.
                // Para este ejemplo, usaré un placeholder si _calculateProgress no está disponible directamente.
                // En un caso real, importa o reimplementa _calculateProgress.
                const progress = (typeof _calculateProgress === 'function') ? _calculateProgress(obj) : (parseFloat(obj.valor_actual || 0) / parseFloat(obj.valor_cuantitativo || 1) * 100 || 0);
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
            // averageProgress: averageProgress, // Si calculaste el promedio de progreso de objetivos activos
        };
    } catch (error) {
        throw new AppError('Error al obtener las estadísticas del perfil.', 500, error);
    }
};

exports.fetchUserAchievements = async (userId) => {
    try {
        // Lógica para determinar logros
        // Esto es muy específico de tu aplicación.
        // Ejemplo: contar objetivos completados, rachas, etc.
        const achievements = [];
        const completedObjectives = await Objetivo.count({ where: { id_usuario: userId, estado: 'Completado' } });

        if (completedObjectives > 0) {
            achievements.push({ id: 'ach1_completed_first', text: 'Primer Objetivo Completado' });
        }
        if (completedObjectives >= 10) {
            achievements.push({ id: 'ach2_completed_10', text: '10 Objetivos Completados' });
        }
        // Ejemplo para racha (requeriría lógica más compleja y posiblemente ActivityLog)
        // const streak = await calculateStreak(userId); // Función hipotética
        // if (streak >= 7) {
        //   achievements.push({ id: 'ach3_streak_7', text: `Racha de ${streak} días` });
        // }

        // Devuelve los datos en el formato que espera el frontend (con o sin iconos)
        return achievements; 
    } catch (error) {
        throw new AppError('Error al obtener los logros del perfil.', 500, error);
    }
};

exports.updateUserProfile = async (userId, profileData) => {
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar.', 404);
        }

        // Selecciona los campos que permites actualizar para evitar que se actualicen campos no deseados
        const allowedUpdates = {};
        const updatableFields = ['nombre_usuario', 'correo_electronico', 'telefono', 'sitio_web', 'biografia', 'ubicacion', /* 'avatar_url' */];
        
        updatableFields.forEach(field => {
            if (profileData[field] !== undefined) { // Solo actualiza si el campo está presente en profileData
                allowedUpdates[field] = profileData[field];
            }
        });

        // Validaciones adicionales aquí si son necesarias (ej. formato de email, teléfono)
        // Considera que si actualizas correo_electronico, podrías necesitar un flujo de verificación.

        await user.update(allowedUpdates);
        // Devuelve el usuario actualizado (quizás solo los campos públicos)
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
    console.log('[Service DEBUG] updateAvatarUrl INICIADO. UserID:', userId, 'URL:', newAvatarUrl, 'DiskPath:', newAvatarDiskPath);
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            console.error('[Service DEBUG] Usuario no encontrado con ID para actualizar avatar:', userId);
            // Si el usuario no existe, eliminar el archivo recién subido
            if (newAvatarDiskPath) {
                await fs.unlink(newAvatarDiskPath).catch(e => console.error("Error eliminando archivo huérfano (usuario no encontrado):", e.message));
            }
            throw new AppError('Usuario no encontrado para actualizar avatar.', 404);
        }
        console.log('[Service DEBUG] Usuario encontrado. Avatar antiguo URL:', user.avatar_url);

        const oldAvatarUrl = user.avatar_url;

        // Actualizar la URL del avatar en el objeto usuario
        user.avatar_url = newAvatarUrl;
        await user.save(); // Guardar el cambio en la base de datos
        console.log('[Service DEBUG] URL de avatar guardada en BD. Nuevo avatarUrl:', user.avatar_url);
        if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) { // No eliminar si la URL es la misma (poco probable aquí)
            try {
                if (oldAvatarUrl.includes('/uploads/avatars/')) {
                    const oldFileName = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf('/') + 1);
                    const oldAvatarFullPath = path.resolve(__dirname, '../../../public/uploads/avatars', oldFileName);
                    
                    console.log('[Service DEBUG] Intentando eliminar avatar antiguo en disco:', oldAvatarFullPath);
                    if (await fs.stat(oldAvatarFullPath).then(() => true).catch(() => false)) { // Verificar si el archivo existe
                       await fs.unlink(oldAvatarFullPath);
                       console.log(`[Service DEBUG] Avatar antiguo eliminado del disco: ${oldAvatarFullPath}`);
                    } else {
                        console.warn(`[Service DEBUG] Archivo de avatar antiguo no encontrado en disco para eliminar: ${oldAvatarFullPath}`);
                    }
                } else {
                    console.warn(`[Service DEBUG] URL de avatar antiguo no sigue el patrón esperado para eliminación: ${oldAvatarUrl}`);
                }
            } catch (e) {
                console.error("[Service DEBUG] Error eliminando avatar antiguo del sistema de archivos:", e.message);
                // No detener el proceso principal si falla la eliminación del archivo antiguo
            }
        }
        return { avatarUrl: user.avatar_url }; // Devuelve un objeto con la propiedad esperada por el controlador
    } catch (error) {
        console.error('[Service DEBUG] Error en updateAvatarUrl:', error);
        // Si hubo un error al actualizar la BD pero el archivo ya se subió, intentar eliminar el archivo nuevo
        if (newAvatarDiskPath) {
             await fs.unlink(newAvatarDiskPath).catch(e => console.error("[Service DEBUG] Error eliminando archivo subido (newAvatarDiskPath) tras fallo de BD:", e.message));
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar la URL del avatar en la base de datos.', 500, error);
    }
};