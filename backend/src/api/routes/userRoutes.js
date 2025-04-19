const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/userController');
const { validarCrearUsuario, validarActualizarUsuario, validarLoginUsuario } = require('../middlewares/userValidation');
// const authMiddleware = require('../middlewares/authMiddleware');

// Rutas de autenticación
router.post('/login', validarLoginUsuario, usuariosController.login);
router.post('/register', validarCrearUsuario, usuariosController.register);


// Rutas para usuarios
router.get('/', usuariosController.obtenerUsuarios);
router.post('/', validarCrearUsuario, usuariosController.crearUsuario);
router.get('/:id', usuariosController.obtenerUsuarioPorId);
router.put('/:id', validarActualizarUsuario, usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);


module.exports = router;