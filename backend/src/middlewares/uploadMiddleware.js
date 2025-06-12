// backend/src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.resolve(__dirname, '../../../public/uploads/avatars');

// Se asegura de que el directorio de subida exista al arrancar la aplicación.
// Si no puede crearse, lanza un error crítico para detener el inicio del servidor.
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`[UploadMiddleware] Directorio para avatares creado en: ${UPLOAD_DIR}`);
    }
} catch (err) {
    const errorMsg = `[UploadMiddleware] FATAL: No se pudo crear el directorio de subida ${UPLOAD_GIR}. Error: ${err.message}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Un usuario debe estar autenticado para subir un avatar. El `authMiddleware` debe ejecutarse antes.
        if (!req.user || !req.user.id) {
            return cb(new AppError('Autenticación requerida para subir archivos.', 401));
        }
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `user-${req.user.id}-avatar-${uniqueSuffix}${extension}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Archivo aceptado
    } else {
        // Archivo rechazado, pasando un AppError para un manejo de errores consistente.
        cb(new AppError('Formato de archivo no permitido. Solo se aceptan imágenes (jpeg, png, gif, webp).', 400), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    },
    fileFilter: fileFilter
});

/**
 * Middleware wrapper que maneja la subida de un solo archivo llamado 'avatar'.
 * Captura y formatea los errores de Multer en instancias de AppError.
 */
const avatarUploadMiddleware = (req, res, next) => {
    const uploader = upload.single('avatar');

    uploader(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError('El archivo es demasiado grande. El límite es de 5MB.', 400));
                }
                // Maneja otros errores de Multer (ej. 'LIMIT_UNEXPECTED_FILE')
                return next(new AppError(`Error al procesar el archivo: ${err.message}.`, 400));
            }
            // Si el error ya es un AppError (ej. de nuestro fileFilter)
            if (err instanceof AppError) {
                return next(err);
            }
            // Otros errores inesperados
            return next(new AppError('Ocurrió un error inesperado durante la subida del archivo.', 500, err));
        }
        // Si no hay error, req.file estará disponible para el siguiente controlador.
        next();
    });
};

module.exports = avatarUploadMiddleware;