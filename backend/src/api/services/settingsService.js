const db = require('../../config/database');
const { Usuario, Objetivo, Progress, ActivityLog } = db.sequelize.models;
const AppError = require('../../utils/AppError');
// const bcrypt = require('bcryptjs'); // bcrypt se usa implícitamente en el modelo Usuario

exports.fetchUserSettings = async (userId) => {
    try {
        const user = await Usuario.findByPk(userId, {
            attributes: [
                'theme_preference', 'language_preference', 'date_format_preference',
                'email_notifications', 'push_notifications',
                // Añade aquí otros campos de configuración que existan en el modelo Usuario
                // 'profile_visibility', 'show_statistics', 'allow_analysis'
            ]
        });

        if (!user) {
            throw new AppError('Usuario no encontrado al buscar configuración.', 404);
        }
        
        // El frontend generalmente espera camelCase
        return {
            preferences: {
                themePreference: user.theme_preference,
                language: user.language_preference,
                dateFormat: user.date_format_preference,
                emailNotifications: user.email_notifications,
                pushNotifications: user.push_notifications,
                // profileVisibility: user.profile_visibility,
                // showStatistics: user.show_statistics,
                // allowAnalysis: user.allow_analysis,
            }
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al obtener la configuración del usuario.', 500, error);
    }
};

exports.updateUserSettings = async (userId, settingsDataFromFrontend) => {
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar configuración.', 404);
        }

        const frontendToModelMapping = {
            themePreference: 'theme_preference',
            language: 'language_preference',
            dateFormat: 'date_format_preference',
            emailNotifications: 'email_notifications',
            pushNotifications: 'push_notifications',
            profileVisibility: 'profile_visibility', // Asegúrate que estos campos existen en tu modelo Usuario
            showStatistics: 'show_statistics',     // si los vas a usar.
            allowAnalysis: 'allow_analysis',
        };

        let fieldsActuallyChanged = false;
        for (const frontendKey in settingsDataFromFrontend) {
            if (Object.prototype.hasOwnProperty.call(frontendToModelMapping, frontendKey)) {
                const modelKey = frontendToModelMapping[frontendKey];
                if (settingsDataFromFrontend[frontendKey] !== undefined) {
                    if (user[modelKey] !== settingsDataFromFrontend[frontendKey]) {
                        user[modelKey] = settingsDataFromFrontend[frontendKey];
                        fieldsActuallyChanged = true;
                    }
                }
            }
        }

        if (fieldsActuallyChanged) {
            await user.save();
        }

        return { message: 'Configuración actualizada con éxito.' };
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
             throw new AppError(`Error de validación: ${error.errors.map(e=>e.message).join(', ')}`, 400, error.errors);
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al actualizar la configuración del usuario.', 500, error);
    }
};

exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await Usuario.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado.', 404);
        }

        const isPasswordValid = await user.comparePassword(currentPassword); // Asume que este método existe en el modelo Usuario
        if (!isPasswordValid) {
            throw new AppError('La contraseña actual es incorrecta.', 400);
        }

        // El hook beforeUpdate/beforeSave en el modelo Usuario se encarga de hashear 'contrasena'
        user.contrasena = newPassword;
        await user.save(); 

        return { message: 'Contraseña actualizada con éxito.' };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al cambiar la contraseña.', 500, error);
    }
};

exports.exportAllUserData = async (userId) => {
    try {
        const user = await Usuario.findByPk(userId, {
            attributes: { exclude: ['contrasena'] }, 
            include: [
                { model: Objetivo, as: 'objetivos' },         // Confirma que 'objetivos' es el alias correcto
                { model: Progress, as: 'progresos' },         // Confirma que 'progresos' es el alias correcto
                { model: ActivityLog, as: 'activityLogs' }, // Confirma que 'activityLogs' es el alias correcto
            ]
        });

        if (!user) {
            throw new AppError('Usuario no encontrado.', 404);
        }
        return user.toJSON();
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error al exportar los datos del usuario.', 500, error);
    }
};

exports.deleteUserAccount = async (userId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const user = await Usuario.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            throw new AppError('Usuario no encontrado para eliminar.', 404);
        }

        // Si las asociaciones tienen onDelete: 'CASCADE', Sequelize debería manejarlas.
        // Para mayor control o si no usan CASCADE, puedes eliminar datos asociados explícitamente aquí:
        // await Objetivo.destroy({ where: { id_usuario: userId }, transaction });
        // ... otros modelos ...

        await user.destroy({ transaction });
        await transaction.commit();

        return { message: 'Cuenta eliminada con éxito.' };
    } catch (error) {
        if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            await transaction.rollback();
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error al eliminar la cuenta del usuario.', 500, error);
    }
};