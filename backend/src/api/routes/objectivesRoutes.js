// backend/src/api/routes/objectivesRoutes.js
const express = require('express');
const router = express.Router();
const objectivesController = require('../controllers/objectivesController');
const { validateCreateObjective, validateUpdateObjective } = require('../../middlewares/objectivesValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

router.param('id', (req, res, next, id) => {
    // Si el ID proporcionado NO es una secuencia de uno o más dígitos...
    if (!/^\d+$/.test(id)) {
        // ...respondemos inmediatamente con un error y detenemos la ejecución.
        return res.status(400).json({ status: 'fail', message: 'El ID del objetivo debe ser un número válido.' });
    }
    // Si es un número válido, continuamos a la siguiente función (el controlador).
    next();
});

router.use(authMiddleware);

router.get('/', objectivesController.getObjectives);
router.post('/', validateCreateObjective, objectivesController.createObjective);
router.get('/:id', objectivesController.getObjectiveById);
router.put('/:id', validateUpdateObjective, objectivesController.updateObjective);
router.delete('/:id', objectivesController.deleteObjective);
router.patch('/:id/unarchive', objectivesController.unarchiveObjective);
module.exports = router;