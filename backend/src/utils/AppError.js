/**
 * @class AppError
 * @extends Error
 * @description Clase personalizada para manejar errores operacionales de la aplicación.
 * Permite especificar un código de estado HTTP, un indicador de si el error es operacional,
 * y opcionalmente, un array de datos de error (ej. para errores de validación).
 */
class AppError extends Error {
    /**
     * Constructor para AppError.
     * @param {string} message - Mensaje de error.
     * @param {number} statusCode - Código de estado HTTP.
     * @param {Array<Object>|Object} [errorsData] - Datos adicionales del error, como un array de errores de validación.
     */
    constructor(message, statusCode, errorsData = undefined) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Para distinguir errores de programación de errores operacionales
        
        if (errorsData) {
            this.errorsData = errorsData; // Almacenar datos de error adicionales
        }

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;