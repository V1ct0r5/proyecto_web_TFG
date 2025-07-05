// backend/src/middlewares/objectivesValidation.js
const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError('Errores de validación.', 400, errors.array()));
    }
    next();
};

const ALLOWED_CATEGORIES = ['HEALTH', 'FINANCE', 'PERSONAL_DEV', 'RELATIONSHIPS', 'CAREER', 'OTHER'];
const ALLOWED_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'FAILED'];

exports.validateCreateObjective = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),

    body('description')
        .optional({ checkFalsy: true }) // Permite que sea string vacío, null o undefined
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede superar los 1000 caracteres.'),

    body('category')
        .isIn(ALLOWED_CATEGORIES).withMessage('La categoría proporcionada no es válida.'),

    // --- CORRECCIÓN DE LA VALIDACIÓN NUMÉRICA ---
    body('initialValue')
        .optional({ checkFalsy: true })
        .trim()
        .isNumeric().withMessage('El valor inicial debe ser un número válido.'),
        
    body('targetValue')
        .optional({ checkFalsy: true })
        .trim()
        .isNumeric().withMessage('El valor meta debe ser un número válido.'),

    body('isLowerBetter')
        .optional()
        .isBoolean().withMessage('El campo isLowerBetter debe ser un valor booleano.'),

    body('unit')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 50 }).withMessage('La unidad no puede superar los 50 caracteres.'),

    body('endDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('La fecha de fin debe tener un formato válido (YYYY-MM-DD).'),

    handleValidationErrors,
];

exports.validateUpdateObjective = [
    body('name').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('category').optional().isIn(ALLOWED_CATEGORIES),
    body('status').optional().isIn(ALLOWED_STATUSES),
    body('targetValue').optional({ checkFalsy: true }).isNumeric(),

    body('progressData.value').optional({ checkFalsy: true }).isNumeric().withMessage('El valor del progreso debe ser numérico.'),
    body('progressData.notes').optional().trim().isLength({ max: 500 }),

    handleValidationErrors,
];