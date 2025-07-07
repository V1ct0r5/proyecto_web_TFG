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

    // Hacemos que la carga del secreto sea consciente del entorno.
    const secret = process.env.NODE_ENV === 'test' 
        ? process.env.JWT_SECRET_TEST 
        : process.env.JWT_SECRET;

    if (!secret) {
        // Añadimos una comprobación de seguridad por si el secreto no está definido
        console.error("FATAL: JWT_SECRET no está definido para la verificación en el entorno actual.");
        return next(new AppError('Error de configuración del servidor de autenticación.', 500));
    }

    jwt.verify(token, secret, (err, decodedUserPayload) => {
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