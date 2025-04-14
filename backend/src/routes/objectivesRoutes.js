const express = require('express');
const router = express.Router();
const objetivesController = require('../controllers/objetivesController');

router.get('/', objetivesController.obtenerObjetivos);
router.post('/', objetivesController.crearObjetivo);
router.get('/:id', objetivesController.obtenerObjetivoPorId);
router.put('/:id', objetivesController.actualizarObjetivo);
router.delete('/:id', objetivesController.eliminarObjetivo);

module.exports = router;