// backend/src/middlewares/objectivesValidation.js
const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware que procesa los resultados de la validación de express-validator.
 * Si hay errores, los empaqueta en un AppError y los pasa al errorHandler global.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError('Errores de validación.', 400, errors.array()));
    }
    next();
};

// Valores permitidos en los ENUMs del modelo refactorizado
const ALLOWED_CATEGORIES = ['HEALTH', 'FINANCE', 'PERSONAL_DEV', 'RELATIONSHIPS', 'CAREER', 'OTHER'];
const ALLOWED_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'FAILED'];

// --- Cadenas de Validación Exportadas ---

/**
 * Valida los datos para la creación de un nuevo objetivo.
 */
exports.validateCreateObjective = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío.')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede superar los 1000 caracteres.'),

    body('category')
        .isIn(ALLOWED_CATEGORIES).withMessage('La categoría proporcionada no es válida.'),

    body('initialValue')
        .optional({ checkFalsy: true })
        .isDecimal().withMessage('El valor inicial debe ser un número.'),

    body('targetValue')
        .optional({ checkFalsy: true })
        .isDecimal().withMessage('El valor meta debe ser un número.'),

    body('isLowerBetter')
        .optional()
        .isBoolean().withMessage('El campo isLowerBetter debe ser un valor booleano.'),

    body('endDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('La fecha de fin debe tener un formato válido (YYYY-MM-DD).'),

    handleValidationErrors,
];

/**
 * Valida los datos para la actualización de un objetivo existente.
 * Los campos son opcionales para permitir actualizaciones parciales.
 */
exports.validateUpdateObjective = [
    body('name').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('category').optional().isIn(ALLOWED_CATEGORIES),
    body('status').optional().isIn(ALLOWED_STATUSES),
    body('targetValue').optional({ checkFalsy: true }).isDecimal(),

    // Validación para la actualización de progreso que puede venir en el mismo request
    body('progressData.value').optional({ checkFalsy: true }).isDecimal().withMessage('El valor del progreso debe ser numérico.'),
    body('progressData.notes').optional().trim().isLength({ max: 500 }).withMessage('Las notas de progreso no pueden superar los 500 caracteres.'),

    handleValidationErrors,
];