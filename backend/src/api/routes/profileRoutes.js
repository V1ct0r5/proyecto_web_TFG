// backend/src/api/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../../middlewares/authMiddleware');
const avatarUploadMiddleware = require('../../middlewares/uploadMiddleware');

// Aplicar autenticación a todas las rutas de perfil primero
router.use(authMiddleware);

router.get('/details', profileController.getProfileDetails);
router.get('/stats', profileController.getProfileStats);
router.get('/achievements', profileController.getProfileAchievements);
router.put('/details', profileController.updateProfileDetails);

// Ruta para subir avatar
router.post(
    '/avatar',
    (req, res, next) => {
        // Log para verificar que la petición llega aquí y el estado de req.user
        console.log('--- [profileRoutes.js DEBUG] Petición POST a /api/profile/avatar RECIBIDA ---');
        console.log('--- [profileRoutes.js DEBUG] req.user ANTES de avatarUploadMiddleware:', req.user ? `Usuario ID: ${req.user.id}` : 'req.user NO DEFINIDO');
        next();
    },
    avatarUploadMiddleware,     // Tu middleware de Multer para procesar el archivo 'avatar'
    profileController.uploadAvatar // Tu controlador final
);

module.exports = router;