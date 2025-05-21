// backend\src\middlewares\userValidation.js
const { body, validationResult } = require('express-validator');

// Función auxiliar para validaciones de texto básicas (trim, no vacío)
const validateTextField = (fieldName, message) =>
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`${message} es obligatorio.`);

// Función auxiliar para validaciones de email
const validateEmail = (fieldName, message) =>
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`${message} es obligatorio.`)
        .isEmail().withMessage(`El formato del ${message.toLowerCase()} es inválido.`);

// Función auxiliar para validaciones de contraseña
const validatePassword = (fieldName, message) =>
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`${message} es obligatoria.`)
        .isLength({ min: 6 }).withMessage(`${message} debe tener al menos 6 caracteres.`);

// Middleware para manejar los resultados de la validación (se repite en cada array como en tu original)
const handleValidationResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validarRegistroUsuario = [
    validateTextField('nombre_usuario', 'El nombre de usuario')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres'),
    validateEmail('correo_electronico', 'El correo electrónico'),
    validatePassword('contrasena', 'La contraseña'),
    handleValidationResult // Usando la función auxiliar
];

const validarInicioSesion = [
    validateEmail('correo_electronico', 'El correo electrónico'),
    validateTextField('contrasena', 'La contraseña'), // Para que use trim y notEmpty
    handleValidationResult // Usando la función auxiliar
];

const validarActualizacionUsuario = [
    body('nombre_usuario') // No podemos usar validateTextField directamente aquí por .optional()
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre de usuario no puede estar vacío si se proporciona')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres'),
    body('correo_electronico') // Similar, no podemos usar validateEmail directamente
        .optional()
        .trim()
        .notEmpty().withMessage('El correo electrónico no puede estar vacío si se proporciona')
        .isEmail().withMessage('El formato del correo electrónico es inválido'),
    body('contrasena') // Similar, no podemos usar validatePassword directamente
        .optional()
        .trim()
        .notEmpty().withMessage('La contraseña no puede estar vacía si se proporciona')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    handleValidationResult // Usando la función auxiliar
];

module.exports = {
    validarRegistroUsuario,
    validarInicioSesion,
    validarActualizacionUsuario
};