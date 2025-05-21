// backend\src\api\controllers\objectivesController.js
const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const db = require('../../config/database');

// Controlador para obtener todos los objetivos del usuario autenticado
exports.obtenerObjetivos = async (req, res) => {
    const userId = req.user;

    try {
        const objetivos = await objectivesService.obtenerObjetivos(userId);
        res.status(200).json(objetivos);
    } catch (error) {
        console.error('Error en objectivesController.obtenerObjetivos:', error); // Log más específico
        // Para errores 500, un mensaje más genérico al cliente.
        // Detalles específicos de SequelizeValidationErrors se manejan en el servicio o validación.
        res.status(500).json({ message: 'Error interno del servidor al obtener los objetivos.' });
    }
};

// Controlador para crear un nuevo objetivo para el usuario autenticado
exports.crearObjetivo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user;
    console.log("Crear Objetivo: userId desde token:", userId); // <-- AGREGAR ESTO
    console.log("Crear Objetivo: Datos recibidos (req.body):", req.body); // <-- AGREGAR ESTO

    const objetivoData = { ...req.body, id_usuario: userId };
    console.log("Crear Objetivo: Datos finales para el servicio (objetivoData):", objetivoData); // <-- AGREGAR ESTO

    try {
        const objetivo = await objectivesService.crearObjetivo(objetivoData);
        res.status(201).json(objetivo);
    } catch (error) {
        console.error('Error en objectivesController.crearObjetivo:', error); // Log más específico
        // Si el error es de validación de Sequelize, significa que el servicio ya ha relanzado un error específico.
        // Idealmente, la mayoría de las validaciones de entrada deberían ser capturadas por express-validator.
        if (error.name === 'SequelizeValidationError' && error.errors && error.errors.length > 0) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        // Para otros errores, un mensaje genérico.
        res.status(500).json({ message: 'Error interno del servidor al crear el objetivo.' });
    }
};

// Controlador para obtener un objetivo específico por ID para el usuario autenticado
exports.obtenerObjetivoPorId = async (req, res) => {
    const userId = req.user;
    const objectiveId = req.params.id;

    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId);

        if (objetivo) {
            res.status(200).json(objetivo);
        } else {
            // Mensaje de 404 claro.
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario.' });
        }
    } catch (error) {
        console.error('Error en objectivesController.obtenerObjetivoPorId:', error); // Log más específico
        res.status(500).json({ message: 'Error interno del servidor al obtener el objetivo.' });
    }
};

// Controlador para actualizar un objetivo específico por ID para el usuario autenticado
exports.actualizarObjetivo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user;
    const objectiveId = req.params.id;
    const updatedData = req.body;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(objectiveId, userId, updatedData);

        if (objetivoActualizado) {
            res.status(200).json(objetivoActualizado);
        } else {
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario.' });
        }
    } catch (error) {
        console.error('Error en objectivesController.actualizarObjetivo:', error);
        if (error.name === 'SequelizeValidationError' && error.errors && error.errors.length > 0) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el objetivo.' });
    }
};

// Controlador para eliminar un objetivo específico por ID para el usuario autenticado
exports.eliminarObjetivo = async (req, res) => {
    const userId = req.user;
    const objectiveId = req.params.id;

    try {
        const deletedCount = await objectivesService.eliminarObjetivo(objectiveId, userId);

        if (deletedCount) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario.' });
        }
    } catch (error) {
        console.error('Error en objectivesController.eliminarObjetivo:', error); // Log más específico
        res.status(500).json({ message: 'Error interno del servidor al eliminar el objetivo.' });
    }
};