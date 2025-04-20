const express = require('express');
const router = express.Router();
const objectivesController = require('../controllers/objectivesController');
const {
    validarCrearObjetivo,
    validarActualizarObjetivo
} = require('../../middlewares/objectivesValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

// Aplicar el authMiddleware a todas las rutas de objetivos
router.use(authMiddleware);

// Rutas para objetivos
router.get('/', objectivesController.obtenerObjetivos);
router.post('/', validarCrearObjetivo, objectivesController.crearObjetivo);
router.get('/:id', objectivesController.obtenerObjetivoPorId);
router.put('/:id', validarActualizarObjetivo, objectivesController.actualizarObjetivo);
router.delete('/:id', objectivesController.eliminarObjetivo);


module.exports = router;