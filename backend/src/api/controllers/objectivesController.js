const objectivesService = require('../services/objectivesService');

exports.obtenerObjetivos = async (req, res) => {
    try {
        const userId = req.user; // Obteniendo el ID del usuario desde el token
        const objetivos = await objectivesService.obtenerObjetivos(userId);
        res.json(objetivos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.crearObjetivo = async (req, res) => {
    try {
        const userId = req.user;
        const objetivoData = { ...req.body, id_usuario: userId }
        const objetivo = await objectivesService.crearObjetivo(objetivoData);
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
        const userId = req.user;
        const objetivo = await objectivesService.obtenerObjetivoPorId(req.params.id, userId);
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
        const userId = req.user;
        const objetivo = await objectivesService.actualizarObjetivo(req.params.id, req.body, userId);
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
        const userId = req.user;
        const deleted = await objectivesService.eliminarObjetivo(req.params.id, userId);
        if (deleted) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: 'Objetivo no encontrado o no pertenece al usuario' });
    }
    } catch (error) {
        console.error('Error al eliminar el objetivo:', error); // Registra el error en la consola
        res.status(500).json({ message: error.message });
    }
};