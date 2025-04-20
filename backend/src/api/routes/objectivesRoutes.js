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
router.get('/objectives', objectivesController.obtenerObjetivos);
router.post('/objectives', validarCrearObjetivo, objectivesController.crearObjetivo);
router.get('/objectives/:id', objectivesController.obtenerObjetivoPorId);
router.put('/objectives/:id', validarActualizarObjetivo, objectivesController.actualizarObjetivo);
router.delete('/objectives/:id', objectivesController.eliminarObjetivo);


module.exports = router;