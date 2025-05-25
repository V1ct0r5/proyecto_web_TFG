/**
 * @class AppError
 * @extends Error
 * @description Clase personalizada para manejar errores operacionales de la aplicación.
 * Permite especificar un código de estado HTTP y un indicador de si el error es operacional.
 */
class AppError extends Error {
    /**
     * Constructor para AppError.
     * @param {string} message - Mensaje de error.
     * @param {number} statusCode - Código de estado HTTP.
     */
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Para distinguir errores de programación de errores operacionales

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;