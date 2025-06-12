// backend/src/api/services/settingsService.js
const db = require('../../config/database');
const { User, Objective, Progress, ActivityLog } = db;
const AppError = require('../../utils/AppError');

/**
 * Service layer for user settings and account management.
 */
class SettingsService {
    /**
     * Fetches a user's application settings.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<object>} The user's settings.
     */
    async fetchUserSettings(userId) {
        const user = await User.findByPk(userId, {
            attributes: ['themePreference', 'languagePreference'] // Añadir más preferencias aquí si existen
        });
        if (!user) {
            throw new AppError('Usuario no encontrado al buscar configuración.', 404);
        }
        return user.toJSON();
    }

    /**
     * Updates a user's settings.
     * @param {number} userId - The ID of the user.
     * @param {object} settingsData - The settings data to update.
     * @returns {Promise<{message: string}>} A confirmation message.
     */
    async updateUserSettings(userId, settingsData) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar configuración.', 404);
        }
        
        // Con claves consistentes entre frontend y backend, el mapeo ya no es necesario.
        // Se asume que `settingsData` contiene claves como `themePreference`, `languagePreference`.
        await user.update(settingsData);
        return { message: 'Configuración actualizada con éxito.' };
    }

    /**
     * Changes a user's password.
     * @param {number} userId - The ID of the user.
     * @param {string} currentPassword - The user's current password.
     * @param {string} newPassword - The new password.
     * @returns {Promise<{message: string}>} A confirmation message.
     */
    async changeUserPassword(userId, currentPassword, newPassword) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado.', 404);
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new AppError('La contraseña actual es incorrecta.', 400);
        }

        // El hook 'beforeUpdate' en el modelo User se encargará de hashear la nueva contraseña.
        user.password = newPassword;
        await user.save();
        return { message: 'Contraseña actualizada con éxito.' };
    }

    /**
     * Exports all data associated with a user account.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<object>} A JSON object with all user data.
     */
    async exportAllUserData(userId) {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Objective, as: 'objectives' },
                { model: Progress, as: 'progressEntries' },
                { model: ActivityLog, as: 'activityLogs' },
            ]
        });
        if (!user) {
            throw new AppError('Usuario no encontrado para exportar datos.', 404);
        }
        return user.toJSON();
    }

    /**
     * Deletes a user account and all associated data within a transaction.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<{message: string}>} A confirmation message.
     */
    async deleteUserAccount(userId) {
        const transaction = await db.sequelize.transaction();
        try {
            const user = await User.findByPk(userId, { transaction });
            if (!user) {
                await transaction.rollback();
                throw new AppError('Usuario no encontrado para eliminar.', 404);
            }

            // `onDelete: 'CASCADE'` en las asociaciones se encarga de eliminar los datos relacionados.
            // La destrucción del usuario disparará la cascada.
            await user.destroy({ transaction });
            await transaction.commit();
            return { message: 'Cuenta de usuario eliminada con éxito.' };
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            throw new AppError('Error al eliminar la cuenta del usuario.', 500, error);
        }
    }
}

module.exports = new SettingsService();