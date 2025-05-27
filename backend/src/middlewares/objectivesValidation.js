const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError'); // Para el manejo de errores centralizado

// Valida campos de texto, permitiendo opcionalidad y configuración de longitud.
const validateStringField = (fieldName, message, { min = 1, max = 255, optional = false } = {}) => {
    let validator = body(fieldName);
    if (optional) {
        validator = validator.optional({ checkFalsy: true }); // Acepta null, '', undefined como válidos si es opcional
    } else {
        validator = validator.notEmpty().withMessage(`${message} no puede estar vacío.`);
    }
    return validator
        .trim()
        .isString().withMessage(`${message} debe ser una cadena.`)
        .isLength({ min, max }).withMessage(`${message} debe tener entre ${min} y ${max} caracteres (si se proporciona).`);
};

// Valida campos numéricos decimales que son opcionales.
const validateDecimalOptional = (fieldName, message) =>
    body(fieldName)
        .optional({ checkFalsy: true })
        .trim() // Aunque es numérico, trim puede limpiar espacios que invalidarían isDecimal
        .isDecimal().withMessage(`${message} debe ser un número decimal válido (si se proporciona).`);

// Valida campos booleanos que son opcionales.
const validateBooleanOptional = (fieldName, message) =>
    body(fieldName)
        .optional() // isBoolean maneja bien true, false, "true", "false"
        .isBoolean().withMessage(`${message} debe ser un valor booleano (true/false) (si se proporciona).`);

// Valida campos de fecha opcionales en formato YYYY-MM-DD.
const validateDateOptional = (fieldName, message) =>
    body(fieldName)
        .optional({ checkFalsy: true })
        .isISO8601({ strict: true, strictSeparator: true }).withMessage(`${message} debe ser una fecha válida en formato YYYY-MM-DD (si se proporciona).`)
        .toDate(); // Convierte a objeto Date para validaciones custom o uso posterior

// Middleware para manejar errores de validación y centralizarlos con AppError.
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError('Errores de validación.', 400, errors.array()));
    }
    next();
};

const tiposDeObjetivoPermitidos = ['Salud', 'Finanzas', 'Desarrollo personal', 'Relaciones', 'Carrera profesional', 'Otros'];
const estadosDeObjetivoPermitidos = ['Pendiente', 'En progreso', 'Completado', 'Archivado', 'Fallido'];

// Validaciones para la creación de un nuevo objetivo
const validarCrearObjetivo = [
    validateStringField('nombre', 'El nombre del objetivo', { min: 3, max: 100 }), // Nombre es obligatorio
    validateStringField('descripcion', 'La descripción', { max: 1000, optional: true }),
    body('tipo_objetivo')
        .notEmpty().withMessage('El tipo de objetivo es obligatorio.')
        .isIn(tiposDeObjetivoPermitidos)
        .withMessage('Tipo de objetivo no válido.'),
    validateDecimalOptional('valor_inicial_numerico', 'El valor inicial numérico'),
    // 'valor_actual' usualmente se inicializa igual a 'valor_inicial_numerico' en el servicio/controlador durante la creación.
    validateDecimalOptional('valor_cuantitativo', 'El valor cuantitativo meta'),
    body('es_menor_mejor') // Si no se envía, se asume false o el default de la DB
        .optional()
        .isBoolean().withMessage('El campo "es_menor_mejor" debe ser booleano.'),
    validateStringField('unidad_medida', 'La unidad de medida', { max: 50, optional: true }),
    validateDateOptional('fecha_inicio', 'La fecha de inicio'),
    validateDateOptional('fecha_fin', 'La fecha de fin')
        .custom((value, { req }) => {
            if (value && req.body.fecha_inicio) { // Validar solo si ambas fechas están presentes
                if (new Date(value) <= new Date(req.body.fecha_inicio)) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
                }
            }
            // En creación, la fecha de fin no puede ser estrictamente pasada
            if (value) {
                const fechaFinObj = new Date(value);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0); // Normalizar para comparar solo la parte de la fecha
                if (fechaFinObj < hoy) {
                     throw new Error('La fecha de fin no puede ser una fecha pasada.');
                }
            }
            return true;
        }),
    // El 'estado' usualmente se establece por defecto a 'Pendiente' en el backend al crear.
    handleValidationErrors
];

// Validaciones para la actualización de un objetivo existente
const validarActualizarObjetivo = [
    validateStringField('nombre', 'El nombre del objetivo', { min: 3, max: 100, optional: true }),
    validateStringField('descripcion', 'La descripción', { max: 1000, optional: true }),
    body('tipo_objetivo')
        .optional()
        .isIn(tiposDeObjetivoPermitidos)
        .withMessage('Tipo de objetivo no válido.'),
    validateDecimalOptional('valor_inicial_numerico', 'El valor inicial numérico (usualmente no editable directamente tras creación)'),
    validateDecimalOptional('valor_actual', 'El valor actual del objetivo'),
    validateDecimalOptional('valor_cuantitativo', 'El valor cuantitativo meta'),
    validateBooleanOptional('es_menor_mejor', 'El campo "es_menor_mejor"'),
    validateStringField('unidad_medida', 'La unidad de medida', { max: 50, optional: true }),
    validateDateOptional('fecha_inicio', 'La fecha de inicio'),
    validateDateOptional('fecha_fin', 'La fecha de fin')
        .custom((value, { req }) => {
            // Para actualización, la validación cruzada de fechas puede ser compleja si se permite
            // actualizar solo una fecha. Se asume que si ambas se envían, se validan.
            // Si solo se envía una, el servicio debería manejar la lógica con la fecha existente.
            const fechaInicioEnBody = req.body.fecha_inicio;
            const fechaFinEnBody = value; // 'value' es fecha_fin en esta cadena de validación

            if (fechaFinEnBody && fechaInicioEnBody) {
                if (new Date(fechaFinEnBody) <= new Date(fechaInicioEnBody)) {
                    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio, si ambas se actualizan.');
                }
            }
            // No se valida contra "hoy" en actualización, ya que se puede estar actualizando un objetivo cuya fecha_fin ya pasó.
            return true;
        }),
    body('estado')
        .optional()
        .isIn(estadosDeObjetivoPermitidos)
        .withMessage('Estado no válido.'),
    // Campos específicos para cuando se actualiza el progreso del objetivo
    validateDecimalOptional('progressValorActual', 'El valor actual del progreso (al actualizar progreso)'), 
    validateStringField('comentarios_progreso', 'Los comentarios del progreso', {max: 500, optional: true}),
    handleValidationErrors
];

module.exports = {
    validarCrearObjetivo,
    validarActualizarObjetivo
};