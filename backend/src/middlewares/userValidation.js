const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError'); // Importar la clase de error personalizada

// Valida campos de texto generales (nombre, etc.)
const validateTextField = (fieldName, message, min = 1, max = 255) =>
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`${message} es obligatorio.`)
        .isLength({ min, max }).withMessage(`${message} debe tener entre ${min} y ${max} caracteres.`);

// Valida campos de correo electrónico
const validateEmailField = (fieldName, message) =>
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`${message} es obligatorio.`)
        .isEmail().withMessage(`El formato del ${message.toLowerCase()} es inválido.`);

// Valida campos de contraseña
const validatePasswordField = (fieldName, message, minLength = 8) => // Default minLength a 8
    body(fieldName)
        // No usar .trim() para contraseñas, permitir espacios si el usuario los incluye intencionadamente
        // notEmpty() ya previene que el campo esté vacío o solo contenga espacios.
        .notEmpty().withMessage(`${message} es obligatoria.`)
        .isLength({ min: minLength }).withMessage(`${message} debe tener al menos ${minLength} caracteres.`);

// Middleware para manejar errores de validación usando AppError
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Pasa los errores al manejador global de errores usando AppError
        return next(new AppError('Errores de validación.', 400, errors.array()));
    }
    next();
};

// Validaciones para el registro de un nuevo usuario
const validarRegistroUsuario = [
    validateTextField('nombre_usuario', 'El nombre de usuario', 3, 50),
    validateEmailField('correo_electronico', 'El correo electrónico'),
    validatePasswordField('contrasena', 'La contraseña', 8), // Mínimo 8 caracteres para el registro
    // Considerar añadir validación para 'confirmar_contrasena' aquí si se envía desde el frontend
    body('confirmar_contrasena').custom((value, { req }) => {
      if (value !== req.body.contrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
    handleValidationErrors
];

// Validaciones para el inicio de sesión
const validarInicioSesion = [
    validateEmailField('correo_electronico', 'El correo electrónico'),
    // Para el login, solo se verifica que la contraseña no esté vacía.
    // La complejidad y longitud se verificaron en el registro.
    body('contrasena').notEmpty().withMessage('La contraseña es obligatoria.'),
    handleValidationErrors
];

// Validaciones para la actualización de datos de usuario
const validarActualizacionUsuario = [
    body('nombre_usuario')
        .optional() // Permite que el campo no se envíe
        .trim()
        .notEmpty().withMessage('El nombre de usuario no puede estar vacío si se proporciona.')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres.'),
    body('correo_electronico')
        .optional()
        .trim()
        .notEmpty().withMessage('El correo electrónico no puede estar vacío si se proporciona.')
        .isEmail().withMessage('El formato del correo electrónico es inválido.'),
    body('contrasena')
        .optional()
        .notEmpty().withMessage('La contraseña no puede estar vacía si se proporciona.')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres si se actualiza.'),
    handleValidationErrors
];

module.exports = {
    validarRegistroUsuario,
    validarInicioSesion,
    validarActualizacionUsuario,
};