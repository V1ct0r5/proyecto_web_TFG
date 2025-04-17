const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/userController');
const { validarCrearUsuario, validarActualizarUsuario } = require('../middlewares/userValidation');

// Rutas para usuarios
router.get('/', usuariosController.obtenerUsuarios);
router.post('/', validarCrearUsuario, usuariosController.crearUsuario);
router.get('/:id', usuariosController.obtenerUsuarioPorId);
router.put('/:id', validarActualizarUsuario, usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;