// backend/src/api/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Ahora esta importación funcionará correctamente:
const { validateUserUpdate } = require('../../middlewares/userValidation');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/:id', userController.getUserById);
router.put('/:id', validateUserUpdate, userController.updateUser); // Esto ya no dará error
router.delete('/:id', userController.deleteUser);

module.exports = router;