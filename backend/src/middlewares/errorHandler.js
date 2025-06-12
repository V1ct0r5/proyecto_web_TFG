// backend/src/middlewares/errorHandler.js
const AppError = require('../utils/AppError');

/**
 * Envía una respuesta de error detallada para el entorno de desarrollo.
 * @param {Error} err - El objeto de error.
 * @param {object} res - El objeto de respuesta de Express.
 */
const sendErrorDev = (err, res) => {
    console.error('ERROR DEVELOPMENT 💥:', err);

    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: {
            name: err.name,
            message: err.message,
            ...err, // Incluye otras propiedades del error como `errorsData`
        },
        stack: err.stack,
    });
};

/**
 * Envía una respuesta de error genérica y segura para el entorno de producción.
 * @param {Error} err - El objeto de error.
 * @param {object} res - El objeto de respuesta de Express.
 */
const sendErrorProd = (err, res) => {
    // Si es un AppError operacional, confiamos en él y lo enviamos al cliente.
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            // Incluir detalles de validación si existen
            ...(err.errorsData && { errors: err.errorsData }),
        });
    }

    // Si no es operacional, logueamos el error completo para los desarrolladores.
    console.error('ERROR PRODUCTION 💣:', err);
    
    // Y enviamos un mensaje genérico al cliente para no exponer detalles.
    return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un problema en el servidor. Por favor, inténtelo de nuevo más tarde.',
    });
};

/**
 * Convierte errores técnicos conocidos en errores operacionales (AppError).
 * @param {Error} error - El error original.
 * @returns {AppError | Error} - Un AppError si el error es conocido, o el error original.
 */
const handleKnownErrors = (error) => {
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return new AppError(`Error de validación: ${messages}`, 400, error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        const field = Object.keys(error.fields)[0] || 'campo';
        return new AppError(`El valor proporcionado para '${field}' ya está en uso.`, 409, error.fields);
    }
    if (error.name === 'JsonWebTokenError') {
        return new AppError('Token de autenticación inválido. Por favor, inicie sesión de nuevo.', 401);
    }
    if (error.name === 'TokenExpiredError') {
        return new AppError('Su sesión ha expirado. Por favor, inicie sesión de nuevo.', 401);
    }
    return error;
};


/**
 * Middleware de manejo de errores principal.
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || (String(err.statusCode).startsWith('4') ? 'fail' : 'error');

    if (process.env.NODE_ENV === 'production') {
        let errorForClient = handleKnownErrors(err);
        sendErrorProd(errorForClient, res);
    } else {
        sendErrorDev(err, res);
    }
};

module.exports = errorHandler;