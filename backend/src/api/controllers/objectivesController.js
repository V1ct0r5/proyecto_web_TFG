const objectivesService = require('../services/objectivesService');
const { validationResult } = require('express-validator');
const db = require('../../config/database');

exports.obtenerObjetivos = async (req, res) => {
    const userId = req.user;
    const transaction = req.transaction;

    try {
        const objetivos = await objectivesService.obtenerObjetivos(userId, transaction);

        res.status(200).json(objetivos);
    } catch (error) {
        console.error('Error al obtener los objetivos:', error);
        res.status(500).json({ message: error.message || 'Error al obtener los objetivos' });
    }
};

exports.crearObjetivo = async (req, res) => {
    const userId = req.user;
    const objetivoData = { ...req.body, id_usuario: userId };

    const transaction = req.transaction;

    try {
        const objetivo = await objectivesService.crearObjetivo(objetivoData, transaction);

        res.status(201).json(objetivo);

    } catch (error) {
        console.error('Error al crear el objetivo:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message || 'Error de validación' });
        }
        res.status(500).json({ message: error.message || 'Error interno al crear el objetivo' });
    }
};

exports.obtenerObjetivoPorId = async (req, res) => {
    const userId = req.user;
    const objectiveId = req.params.id;

    const transaction = req.transaction;

    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(objectiveId, userId, transaction);

        if (objetivo) {
            res.status(200).json(objetivo);
        } else {
            console.log('Controller: obtenerObjetivoPorId - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al obtener el objetivo por ID:', error);
        res.status(500).json({ message: error.message || 'Error al obtener el objetivo' });
    }
};

exports.actualizarObjetivo = async (req, res) => {
    const userId = req.user;
    const objectiveId = req.params.id;
    // req.body ya puede contener valor_actual si el frontend lo envía
    const updatedData = req.body;

    const transaction = req.transaction;

    try {
        const objetivoActualizado = await objectivesService.actualizarObjetivo(objectiveId, updatedData, userId, transaction);

        if (objetivoActualizado) {
            res.status(200).json(objetivoActualizado);
        } else {
            console.log('Controller: actualizarObjetivo - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al actualizar el objetivo:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message || 'Error de validación' });
        }
        res.status(500).json({ message: error.message || 'Error interno al actualizar el objetivo' });
    }
};

exports.eliminarObjetivo = async (req, res) => {
    const userId = req.user;
    const objectiveId = req.params.id;

    const transaction = req.transaction;

    try {
        const deletedCount = await objectivesService.eliminarObjetivo(objectiveId, userId, transaction);

        if (deletedCount > 0) {
            res.status(204).send();
        } else {
            console.log('Controller: eliminarObjetivo - Objetivo no encontrado o no pertenece (404)');
            res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
        }
    } catch (error) {
        console.error('Error al eliminar el objetivo:', error);
        res.status(500).json({ message: error.message || 'Error al eliminar el objetivo' });
    }
};