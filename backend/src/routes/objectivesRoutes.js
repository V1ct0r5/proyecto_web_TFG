const express = require('express');
const router = express.Router();
const objectivesController = require('../controllers/objectivesController');

router.get('/', objectivesController.obtenerObjetivos);
router.post('/', objectivesController.crearObjetivo);
router.get('/:id', objectivesController.obtenerObjetivoPorId);
router.put('/:id', objectivesController.actualizarObjetivo);
router.delete('/:id', objectivesController.eliminarObjetivo);

module.exports = router;