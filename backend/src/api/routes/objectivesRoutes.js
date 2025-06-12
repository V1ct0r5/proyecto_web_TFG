// backend/src/api/routes/objectivesRoutes.js
const express = require('express');
const router = express.Router();
const objectivesController = require('../controllers/objectivesController');
const { validateCreateObjective, validateUpdateObjective } = require('../../middlewares/objectivesValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', objectivesController.getObjectives);
router.post('/', validateCreateObjective, objectivesController.createObjective);
router.get('/:id', objectivesController.getObjectiveById);
router.put('/:id', validateUpdateObjective, objectivesController.updateObjective);
router.delete('/:id', objectivesController.deleteObjective);

module.exports = router;