const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController'); // Asumiendo que creaste este controlador
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware); // Proteger todas las rutas del dashboard

router.get('/dashboard/summary-stats', dashboardController.getDashboardSummaryStats);
router.get('/dashboard/recent-objectives', dashboardController.getRecentObjectivesPreview);
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

module.exports = router;