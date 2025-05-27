// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError'); // Para un manejo de errores centralizado
require('dotenv').config(); // Asegura que las variables de entorno estén cargadas

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Verificar si el header de autorización existe y tiene el formato 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Acceso denegado. Token no proporcionado o con formato incorrecto.', 401));
    }

    const token = authHeader.split(' ')[1];

    // Verificar si el token fue extraído correctamente
    if (!token) {
        // Este caso es principalmente una doble verificación si startsWith('Bearer ') es efectivo.
        return next(new AppError('Acceso denegado. Token no pudo ser extraído.', 401));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUserPayload) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new AppError('Token expirado. Por favor, inicia sesión de nuevo.', 401));
            }
            // Para JsonWebTokenError (token malformado, firma inválida) u otros errores de jwt.verify
            return next(new AppError('Token inválido o la autenticación ha fallado.', 403)); // 403 Forbidden para token inválido
        }
        
        // Adjuntar el payload decodificado del usuario a req.user para uso en controladores posteriores
        req.user = decodedUserPayload; 
        next();
    });
};

module.exports = authMiddleware;