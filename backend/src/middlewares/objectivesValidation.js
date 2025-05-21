// backend\src\middlewares\objectivesValidation.js
const { body, validationResult } = require('express-validator');

// Función auxiliar para validaciones de cadena comunes (no vacío, trim, escape, pero sin escape por ahora si no es requerido)
// Para 'nombre' y 'descripcion' que quizás no necesiten escape si no contienen HTML
const validateString = (fieldName, message, minLength = 0, maxLength = 255) =>
    body(fieldName)
        .notEmpty().withMessage(`${message} es obligatorio.`)
        .isString().withMessage(`${message} debe ser una cadena de texto.`)
        .trim()
        .isLength({ min: minLength, max: maxLength }).withMessage(`${message} debe tener entre ${minLength} y ${maxLength} caracteres.`);

// Función auxiliar para validaciones de número (opcionalmente vacío, es numérico, trim)
const validateNumericOptional = (fieldName, message) =>
    body(fieldName)
        .optional({ checkFalsy: true }) // Permite que sea opcional, pero si existe, valídalo
        .trim()
        .isDecimal().withMessage(`${message} debe ser un número decimal.`); // isDecimal como en tu original

// Validación de la fecha de inicio
const validateStartDate = (fieldName) =>
    body(fieldName)
        .optional({ checkFalsy: true })
        .isDate().withMessage('La fecha de inicio no es válida')
        .custom((value) => {
            if(!value) return true; // Si es opcional y no se proporciona, pasa

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);
            return startDate >= currentDate;
        })
        .withMessage('La fecha de inicio debe ser mayor o igual a la fecha actual');

// Validación de la fecha de fin
const validateEndDate = (fieldName) =>
    body(fieldName)
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de fin no es válida')
        .custom((value, { req }) => {
            if (!value) {
                return true; // Si es opcional y no se proporciona, pasa
            }

            const fechaFin = new Date(value);
            fechaFin.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            if (fechaFin < currentDate) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha actual');
            }

            if (req.body.fecha_inicio) {
                const fechaInicio = new Date(req.body.fecha_inicio);
                fechaInicio.setHours(0, 0, 0, 0);
                if (fechaFin <= fechaInicio) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
            }
            return true;
        })
        .withMessage('La fecha de fin debe ser hoy o una fecha futura y posterior a la fecha de inicio');


// Validaciones para la creación de objetivos (POST)
const validarCrearObjetivo = [
    validateString('nombre', 'El nombre', 3), // Tu original usaba 'nombre' y mínimo 3 caracteres
    body('tipo_objetivo')
        .notEmpty()
        .withMessage('El tipo de objetivo es obligatorio')
        .isIn(['Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros']) // Tus tipos originales
        .withMessage('El tipo de objetivo no es válido'),

    validateNumericOptional('valor_cuantitativo', 'El valor cuantitativo'),
    body('unidad_medida') // Tu original lo tenía sin validateString
        .optional()
        .isLength({ max: 50 })
        .withMessage('La unidad de medida debe tener como máximo 50 caracteres'),

    validateStartDate('fecha_inicio'),
    validateEndDate('fecha_fin'),

    // Middleware para manejar los resultados de la validación
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validaciones para la actualización de objetivos (PUT)
const validarActualizarObjetivo = [
    body('nombre') // Tu original usaba 'nombre'
        .optional()
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),

    body('tipo_objetivo')
        .optional()
        .isIn(['Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros']) // Tus tipos originales
        .withMessage('El tipo de objetivo no es válido'),

    validateNumericOptional('valor_cuantitativo', 'El valor cuantitativo'),
    body('unidad_medida')
        .optional()
        .isLength({ max: 50 })
        .withMessage('La unidad de medida debe tener como máximo 50 caracteres'),

    body('fecha_inicio') // Mantener la estructura de tu original con optional({checkFalsy: true})
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de inicio no es válida')
        .custom((value) => {
            if (!value) return true;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);
            return startDate >= currentDate;
        })
        .withMessage('La fecha de inicio debe ser mayor o igual a la fecha actual'),

    body('fecha_fin') // Mantener la estructura de tu original con optional({checkFalsy: true})
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de fin no es válida')
        .custom((value, { req }) => {
            if (!value) {
                return true;
            }

            const fechaFin = new Date(value);
            fechaFin.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            if (fechaFin < currentDate) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha actual');
            }

            if (req.body.fecha_inicio) {
                const fechaInicio = new Date(req.body.fecha_inicio);
                fechaInicio.setHours(0, 0, 0, 0);
                if (fechaFin <= fechaInicio) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                }
            }
            return true;
        })
        .withMessage('La fecha de fin debe ser hoy o una fecha futura y posterior a la fecha de inicio'),

    // Middleware para manejar los resultados de la validación
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarCrearObjetivo,
    validarActualizarObjetivo
};