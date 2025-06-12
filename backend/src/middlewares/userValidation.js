// backend/src/middlewares/userValidation.js
const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware que procesa los resultados de la validación de express-validator.
 * Si hay errores, los empaqueta en un AppError y los pasa al errorHandler global.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Usa el AppError para un manejo de errores centralizado y consistente.
        return next(new AppError('Se encontraron errores de validación.', 400, errors.array()));
    }
    next();
};

/**
 * Cadena de validación para el registro de un nuevo usuario.
 * Verifica nombre de usuario, email, contraseña y la confirmación de la contraseña.
 */
exports.validateRegistration = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es obligatorio.')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres.'),
    
    body('email')
        .trim()
        .isEmail().withMessage('El formato del correo electrónico es inválido.'),

    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden.');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Cadena de validación para el inicio de sesión.
 * Verifica el formato del email y que la contraseña no esté vacía.
 */
exports.validateLogin = [
    body('email')
        .trim()
        .isEmail().withMessage('El formato del correo electrónico es inválido.'),
    
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.'),

    handleValidationErrors
];

/**
 * Cadena de validación para la actualización de un perfil de usuario.
 * Los campos son opcionales, pero si se proporcionan, se validan.
 */
exports.validateUserUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres.'),
    
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('El formato del correo electrónico es inválido.'),
    
    // Nota: La validación de un cambio de contraseña es más compleja (requiere contraseña actual)
    // y se maneja en un endpoint y servicio dedicados, por lo que no se incluye aquí.

    handleValidationErrors
];