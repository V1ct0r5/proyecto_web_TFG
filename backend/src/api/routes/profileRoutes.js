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
    avatarUploadMiddleware,   // Tu middleware de Multer para procesar el archivo 'avatar'
    profileController.uploadAvatar // Tu controlador final
);

module.exports = router;