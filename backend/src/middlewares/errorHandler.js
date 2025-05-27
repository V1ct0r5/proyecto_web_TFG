// backend/src/middlewares/errorHandler.js
const AppError = require('../utils/AppError');

// Envía errores detallados en el entorno de desarrollo.
const sendErrorDev = (err, res) => {
    // El logueo explícito en desarrollo puede ser útil, pero la respuesta ya es detallada.
    // console.error('ERROR 💥 DEVELOPMENT:', err); 

    const responseBody = {
        status: err.status || 'error',
        errorName: err.name, // Nombre del error original
        message: err.message,
        stack: err.stack, // Stack trace completo para depuración
    };

    // Incluir datos de error de validación si AppError los contiene
    if (err.errorsData && Array.isArray(err.errorsData)) {
        responseBody.validationErrors = err.errorsData;
    } else if (err.errors && Array.isArray(err.errors) && 
               (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError')) {
        // Incluir errores específicos de Sequelize si no fueron envueltos en errorsData por un paso previo
        responseBody.sequelizeErrors = err.errors;
    }
    
    res.status(err.statusCode || 500).json(responseBody);
};

// Envía errores controlados y genéricos en el entorno de producción.
const sendErrorProd = (err, res) => {
    let errorToRespond = err;

    // Convertir errores conocidos no operacionales (o AppErrors no operacionales)
    // a AppError operacionales con mensajes amigables para producción.
    if (!(errorToRespond instanceof AppError) || !errorToRespond.isOperational) { 
        if (err.name === 'SequelizeValidationError') {
            const messages = err.errors.map(e => e.message).join('. ');
            // Pasar los errores originales de Sequelize como errorsData
            errorToRespond = new AppError(`Error de validación en los datos: ${messages}`, 400, err.errors); 
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            const field = err.fields && Object.keys(err.fields).length > 0 ? Object.keys(err.fields)[0] : 'un campo';
             // Pasar los campos en conflicto como errorsData (aunque es un objeto, no array, pero AppError lo permite)
            errorToRespond = new AppError(`El valor proporcionado para '${field}' ya está en uso. Por favor, utiliza otro.`, 409, err.fields); // 409 Conflict
        } else if (err.name === 'JsonWebTokenError') {
            errorToRespond = new AppError('Token de autenticación inválido. Por favor, inicia sesión de nuevo.', 401);
        } else if (err.name === 'TokenExpiredError') {
            errorToRespond = new AppError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 401);
        } else {
            // Para todos los demás errores (de programación, desconocidos, o AppErrors no operacionales no manejados)
            console.error('ERROR 💣 PRODUCCIÓN (No operacional/desconocido):', err); // Loguear el error original completo es crucial
            errorToRespond = new AppError('Algo salió muy mal en el servidor. Nuestro equipo ha sido notificado.', 500);
        }
    }

    // Construir el cuerpo de la respuesta para errores operacionales
    const responseBody = {
        status: errorToRespond.status,
        message: errorToRespond.message,
    };
    
    // Si el AppError (original o convertido) tiene errorsData (típicamente de validación), incluirlos.
    if (errorToRespond.errorsData && Array.isArray(errorToRespond.errorsData)) {
        responseBody.errors = errorToRespond.errorsData;
    }
    
    return res.status(errorToRespond.statusCode).json(responseBody);
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
    // Asegurar valores por defecto para statusCode y status, aunque AppError ya los define.
    err.statusCode = err.statusCode || 500;
    err.status = err.status || (String(err.statusCode).startsWith('4') ? 'fail' : 'error');

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(err, res);
    } else { 
        // Entorno NODE_ENV desconocido o no configurado
        console.error('ERROR (Entorno NODE_ENV no configurado o desconocido):', err);
        res.status(500).json({
            status: 'error',
            message: 'Error interno crítico del servidor. Por favor, contacte al administrador.',
        });
    }
};

module.exports = errorHandler;