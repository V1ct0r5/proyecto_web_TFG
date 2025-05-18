const validationResult = require('express-validator').validationResult;
const { body } = require('express-validator');

const validarCrearObjetivo = [

    body('nombre')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),
    
    body('tipo_objetivo')
        .notEmpty()
        .withMessage('El tipo de objetivo es obligatorio')
        .isIn(['Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros'])
        .withMessage('El tipo de objetivo no es válido'),

    body('valor_cuantitativo')
        .optional()
        .isDecimal()
        .withMessage('El valor cuantitativo debe ser un número decimal'),

    body('unidad_medida')
        .optional()
        .isLength({ max: 50 })
        .withMessage('La unidad de medida debe tener como máximo 50 caracteres'),

    body('fecha_inicio')
        .optional({ checkFalsy: true })
        .isDate().withMessage('La fecha de inicio no es válida')
        .custom((value) => {
            if(!value) return true;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);
            return startDate >= currentDate;
        })
        .withMessage('La fecha de inicio debe ser mayor o igual a la fecha actual'),

    body('fecha_fin')
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
    

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validarActualizarObjetivo = [
    body('nombre')
        .optional()
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),
    
    body('tipo_objetivo')
        .optional()
        .isIn(['Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros'])
        .withMessage('El tipo de objetivo no es válido'),

    body('valor_cuantitativo')
        .optional()
        .isDecimal()
        .withMessage('El valor cuantitativo debe ser un número decimal'),

    body('unidad_medida')
        .optional()
        .isLength({ max: 50 })
        .withMessage('La unidad de medida debe tener como máximo 50 caracteres'),

        body('fecha_inicio')
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

    body('fecha_fin')
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