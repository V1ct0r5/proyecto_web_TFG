const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/userController');
const { validarRegistroUsuario, validarInicioSesion, validarActualizacionUsuario } = require('../../middlewares/userValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/auth/register', validarRegistroUsuario, usuariosController.registrarUsuario);
router.post('/auth/login', validarInicioSesion, usuariosController.iniciarSesionUsuario);
router.delete('/auth/logout', authMiddleware, usuariosController.cerrarSesionUsuario);


router.get('/users', authMiddleware, usuariosController.obtenerUsuarios);
router.post('/users', authMiddleware, validarRegistroUsuario, usuariosController.crearUsuario);
router.get('/users/:id', authMiddleware, usuariosController.obtenerUsuarioPorId);
router.put('/users/:id', authMiddleware, validarActualizacionUsuario, usuariosController.actualizarUsuario);
router.delete('/users/:id', authMiddleware, usuariosController.eliminarUsuario);



module.exports = router;