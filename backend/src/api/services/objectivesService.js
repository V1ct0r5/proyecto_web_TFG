const Objetivo = require('../models/objectives');

exports.obtenerObjetivos = async () => {
    try {
        return await Objetivo.findAll();
    } catch (error) {
        throw error;
    }
};

exports.crearObjetivo = async (objetivoData) => {
    try {
        return await Objetivo.create(objetivoData);
    } catch (error) {
        throw error;
    }
};

exports.obtenerObjetivoPorId = async (id) => {
    try {
        return await Objetivo.findByPk(id);
    } catch (error) {
        throw error;
    }
};

exports.actualizarObjetivo = async (id, objetivoData) => {
    try {
        await Objetivo.update(objetivoData, {
            where: { id: id }
        });
        return await Objetivo.findByPk(id);
    } catch (error) {
        throw error;
    }
};

exports.eliminarObjetivo = async (id) => {
    try {
        await Objetivo.destroy({
            where: { id: id }
        });
    } catch (error) {
        throw error;
    }
};