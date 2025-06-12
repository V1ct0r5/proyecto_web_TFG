// backend/src/utils/getAuthUserId.js
const AppError = require('./AppError');

/**
 * Extrae de forma segura el ID de usuario autenticado de la petición.
 * @param {object} req - Objeto de la petición de Express.
 * @returns {number} El ID del usuario.
 * @throws {AppError} Si el ID de usuario no se encuentra.
 */
const getAuthUserId = (req) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError('Error de autenticación: ID de usuario no encontrado.', 401);
    }
    return userId;
};

module.exports = getAuthUserId;