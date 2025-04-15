const objectivesService = require('../services/objectivesService');

exports.obtenerObjetivos = async (req, res) => {
    try {
        const objetivos = await objectivesService.obtenerObjetivos();
        res.json(objetivos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.crearObjetivo = async (req, res) => {
    try {
        const objetivo = await objectivesService.crearObjetivo(req.body);
        res.status(201).json(objetivo);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            res.status(400).json({ message: error.errors[0].message });
        }
        console.error('Error al crear el objetivo:', error); // Registra el error en la consola
        res.status(400).json({ message: error.message });
        
    }
};

exports.obtenerObjetivoPorId = async (req, res) => {
    try {
        const objetivo = await objectivesService.obtenerObjetivoPorId(req.params.id);
        if (objetivo) {
            res.json(objetivo);
        } else {
            res.status(404).json({ message: 'Objetivo no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el objetivo:', error); // Registra el error en la consola
        res.status(500).json({ message: error.message });
    }
};

exports.actualizarObjetivo = async (req, res) => {
    try {
        const objetivo = await objectivesService.actualizarObjetivo(req.params.id, req.body);
        res.json(objetivo);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error('Error al actualizar el objetivo:', error); // Registra el error en la consola
        res.status(400).json({ message: error.message });
    }
};

exports.eliminarObjetivo = async (req, res) => {
    try {
        await objectivesService.eliminarObjetivo(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        console.error('Error al eliminar el objetivo:', error); // Registra el error en la consola
        res.status(500).json({ message: error.message });
    }
};