const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Rutas existentes
router.get('/summary', analysisController.getSummaryStats);
router.get('/distribution/category', analysisController.getCategoryDistribution);
router.get('/distribution/status', analysisController.getObjectiveStatusDistribution);
router.get('/progress/monthly', analysisController.getMonthlyProgress);

// Nuevas rutas para análisis avanzado
router.get('/objectives-progress', analysisController.getObjectivesProgressData);
router.get('/ranked-objectives', analysisController.getRankedObjectives);
router.get('/category-average-progress', analysisController.getCategoryAverageProgressData);
router.get('/objectives-by-category-detailed', analysisController.getDetailedObjectivesByCategory);

module.exports = router;