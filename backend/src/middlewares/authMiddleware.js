// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
require('dotenv').config();

/**
 * Middleware para verificar la autenticación del usuario a través de un token JWT.
 * Espera un header 'Authorization' con el formato 'Bearer <token>'.
 * Si la autenticación es exitosa, adjunta el payload del usuario a `req.user`.
 * De lo contrario, pasa un AppError al siguiente middleware de errores.
 *
 * @param {object} req - El objeto de petición de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @param {function} next - La función para pasar al siguiente middleware.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Acceso denegado. Token no proporcionado o con formato incorrecto.', 401));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next(new AppError('Acceso denegado. Token no encontrado en la cabecera.', 401));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUserPayload) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new AppError('Token expirado. Por favor, inicie sesión de nuevo.', 401));
            }
            // Cubre 'JsonWebTokenError' y otros errores de verificación
            return next(new AppError('Token inválido. La autenticación ha fallado.', 403));
        }
        
        // Adjunta el payload decodificado a la petición para su uso posterior
        req.user = decodedUserPayload; 
        next();
    });
};

module.exports = authMiddleware;