const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/userController');
const { validarCrearUsuario, validarActualizarUsuario, validarLoginUsuario } = require('../../middlewares/userValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

// Rutas de autenticación (bajo /api/auth)
router.post('/auth/register', validarCrearUsuario, usuariosController.registrarUsuario);
router.post('/auth/login', validarLoginUsuario, usuariosController.iniciarSesionUsuario);
router.delete('/auth/logout', authMiddleware, usuariosController.cerrarSesionUsuario);


// Rutas para usuarios (protegidas por autenticación)
router.get('/users', authMiddleware, usuariosController.obtenerUsuarios);
router.post('/users', authMiddleware, validarCrearUsuario, usuariosController.crearUsuario);
router.get('/users/:id', authMiddleware, usuariosController.obtenerUsuarioPorId);
router.put('/users/:id', authMiddleware, validarActualizarUsuario, usuariosController.actualizarUsuario);
router.delete('/users/:id', authMiddleware, usuariosController.eliminarUsuario);



module.exports = router;