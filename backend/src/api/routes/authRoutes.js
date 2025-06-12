// backend/src/api/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Lo renombraremos en el siguiente paso
const { validateRegistration, validateLogin } = require('../../middlewares/userValidation'); // Lo renombraremos
const authMiddleware = require('../../middlewares/authMiddleware');

// Rutas públicas de autenticación (sin authMiddleware global)
router.post('/register', validateRegistration, userController.register);
router.post('/login', validateLogin, userController.login);

// Ruta protegida
router.delete('/logout', authMiddleware, userController.logout);

module.exports = router;