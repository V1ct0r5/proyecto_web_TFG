// backend/src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.resolve(__dirname, '../../../public/uploads/avatars');

// Asegurarse de que el directorio de subida exista al iniciar la aplicación.
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.info(`[UploadMiddleware] Directorio de subida creado en: ${UPLOAD_DIR}`); // Log informativo
    } catch (err) {
        const errorMsg = `[UploadMiddleware] ERROR CRÍTICO: No se pudo crear el directorio de subida ${UPLOAD_DIR}: ${err.message}`;
        console.error(errorMsg);
        // Considerar detener la aplicación si el directorio es esencial y no se puede crear.
        // Por ejemplo, lanzando un error que detenga el proceso de inicio:
        throw new Error(errorMsg); 
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Comprobación de tiempo de ejecución por si el directorio fue eliminado después del inicio
        if (!fs.existsSync(UPLOAD_DIR)) {
            // Este error es interno del servidor, ya que el directorio debería existir.
            return cb(new AppError('Error interno: El directorio de subida no está disponible (runtime).', 500));
        }
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        if (!req.user || !req.user.id) {
            // Este error debería ser prevenido por un middleware de autenticación anterior.
            return cb(new AppError('Usuario no autenticado para nombrar el archivo.', 401));
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();
        const finalFilename = `user-${req.user.id}-avatar-${uniqueSuffix}${extension}`;
        cb(null, finalFilename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Añadido image/webp como ejemplo
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Aceptar archivo
    } else {
        // Rechazar archivo, pasando un AppError para ser manejado consistentemente
        cb(new AppError(`Formato de archivo no permitido (${file.mimetype}). Solo se aceptan imágenes JPG, PNG, GIF o WEBP.`, 400), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de tamaño de archivo: 10MB
    },
    fileFilter: fileFilter
});

// Middleware wrapper para un mejor manejo de errores de Multer.
const avatarUploadMiddleware = (req, res, next) => {
    const uploader = upload.single('avatar'); // 'avatar' es el nombre del campo que el frontend debe usar

    uploader(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError('El archivo es demasiado grande. Máximo 10MB permitido.', 400));
                }
                // Otros errores específicos de Multer (ej. 'LIMIT_UNEXPECTED_FILE')
                return next(new AppError(`Error al procesar archivo: ${err.message} (Código: ${err.code})`, 400));
            }
            // Si es un AppError de nuestro fileFilter o storage
            if (err instanceof AppError) {
                return next(err);
            }
            // Otros errores inesperados durante la subida
            return next(new AppError('Error inesperado durante la subida del archivo.', 500, err));
        }
        // Si no hubo error, req.file debería estar poblado por Multer.
        // El controlador siguiente verificará si req.file existe.
        next();
    });
};

module.exports = avatarUploadMiddleware;