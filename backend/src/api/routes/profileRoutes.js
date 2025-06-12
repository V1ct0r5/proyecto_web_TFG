// backend/src/api/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../../middlewares/authMiddleware');
const avatarUploadMiddleware = require('../../middlewares/uploadMiddleware');

router.use(authMiddleware);

// --- Rutas GET ---
router.get('/', profileController.getUserProfile); //
router.get('/stats', profileController.getUserStats); //

// --- Ruta ÚNICA para Actualizar Perfil (Texto y/o Avatar) ---
// El middleware procesa el archivo primero, y luego el controlador recibe tanto req.body como req.file.
router.patch(
    '/',
    avatarUploadMiddleware, // 1. Procesa el archivo y los campos de texto.
    profileController.updateUserProfile // 2. El controlador actualiza la base de datos.
);

module.exports = router;