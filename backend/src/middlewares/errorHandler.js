// backend/src/middlewares/errorHandler.js
const AppError = require('../utils/AppError');

/**
 * Middleware de manejo de errores global.
 * Captura y procesa errores ocurridos en la aplicación.
 * @param {Error|AppError} err - El objeto de error.
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - La función para pasar al siguiente middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Si el error ya tiene statusCode y status, probablemente es un AppError que hemos creado
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Loguear el error de forma más detallada en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
    console.error(err.stack); // Stack trace para depuración
    
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack, // Enviar stack trace solo en desarrollo
    });
  }

  // En producción, enviar mensajes más genéricos para errores no operacionales
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // Copia del error para no mutar el original
    error.message = err.message;

    // Si es un error de validación de Sequelize (ejemplo)
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message).join('. ');
      error = new AppError(`Error de validación: ${messages}`, 400);
    }
    // Si es un error de restricción única de Sequelize (ejemplo)
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(err.fields)[0];
      error = new AppError(`El valor para ${field} ya existe. Por favor, usa otro.`, 400);
    }
    // Si es un error de JWT (ejemplo)
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Token inválido. Por favor, inicia sesión de nuevo.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 401);
    }

    // Errores operacionales (confiables para enviar al cliente)
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }
    
    // Errores de programación o desconocidos: no filtrar detalles al cliente
    // 1) Loguear el error
    console.error('ERROR 💥 (PRODUCTION):', error);
    // 2) Enviar respuesta genérica
    return res.status(500).json({
      status: 'error',
      message: 'Algo salió muy mal en el servidor. Inténtalo de nuevo más tarde.',
    });
  }
};

module.exports = errorHandler;