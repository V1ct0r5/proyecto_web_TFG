const { body, validationResult } = require('express-validator');

const validarCrearUsuario = [

    body('nombre_usuario')
        .notEmpty()
        .withMessage('El nombre de usuario es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
    body('correo_electronico')
        .notEmpty()
        .withMessage('El correo electrónico es obligatorio')
        .isEmail()
        .withMessage('El formato del correo electrónico es inválido'),
    body('contrasena')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/\d/)
        .withMessage('La contraseña debe contener al menos un número')
        .matches(/[a-zA-Z]/)
        .withMessage('La contraseña debe contener al menos una letra'),
    body('confirmar_contrasena')
        .notEmpty()
        .withMessage('La confirmación de la contraseña es obligatoria')
        .custom((value, { req }) => {
            if (value !== req.body.contrasena) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validarActualizarUsuario = [
    body('nombre_usuario')
        .optional()
        .isLength({ min: 3 })
        .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
    body('correo_electronico')
        .optional()
        .isEmail()
        .withMessage('El formato del correo electrónico es inválido'),
    body('contrasena')
        .optional()
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/\d/)
        .withMessage('La contraseña debe contener al menos un número')
        .matches(/[a-zA-Z]/)
        .withMessage('La contraseña debe contener al menos una letra'),
    body('confirmar_contrasena')
        .optional()
        .custom((value, { req }) => {
            if (value !== req.body.contrasena) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarCrearUsuario,
    validarActualizarUsuario
};