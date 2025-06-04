const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../../middlewares/authMiddleware');

// Todas las rutas de configuración requieren autenticación
router.use(authMiddleware);

// Rutas para la configuración general
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Ruta para cambiar contraseña
router.put('/change-password', settingsController.changePassword);

// Ruta para exportar datos
router.get('/export-data', settingsController.exportUserData);

// Ruta para eliminar cuenta
router.delete('/account', settingsController.deleteAccount);

module.exports = router;