// backend/src/utils/controllerFactory.js
const AppError = require('./AppError');

/**
 * Extrae el ID de usuario autenticado de la petición.
 * @param {object} req - Objeto de la petición de Express.
 * @returns {number} El ID del usuario.
 */
const getAuthUserId = (req) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError('Error de autenticación: ID de usuario no encontrado.', 401);
    }
    return userId;
};

/**
 * Crea un controlador estándar que maneja la lógica común de llamar a un servicio.
 * @param {Function} serviceFunction - La función del servicio a ejecutar.
 * @param {Array<'userId'|'params'|'query'|'body'>} params - Los parámetros que se pasarán a la función de servicio.
 */
exports.createController = (serviceFunction, params = ['userId']) => {
    return async (req, res, next) => {
        try {
            const args = [];
            if (params.includes('userId')) args.push(getAuthUserId(req));
            if (params.includes('params')) args.push(req.params);
            if (params.includes('query')) args.push(req.query);
            if (params.includes('body')) args.push(req.body);

            const result = await serviceFunction(...args);
            
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
};