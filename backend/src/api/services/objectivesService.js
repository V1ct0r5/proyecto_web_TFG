const Objetivo = require('../models/objectives');

exports.obtenerObjetivos = async (userId) => {
    try {
        return await Objetivo.findAll({ where: { id_usuario: userId } });
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

exports.obtenerObjetivoPorId = async (id_objetivo, userId) => {
    try {
        return await Objetivo.findByPk(id_objetivo, { where: { id_usuario: userId } });
    } catch (error) {
        throw error;
    }
};

exports.actualizarObjetivo = async (id_objetivo, objetivoData, userId) => {
    try {
        const [updated] = await Objetivo.update(objetivoData, {
            where: { id_objetivo: id_objetivo, id_usuario: userId }
        });
        if(updated){return await Objetivo.findByPk(id_objetivo);}
        return null;
    } catch (error) {
        throw error;
    }
};

exports.eliminarObjetivo = async (id_objetivo, userId) => {
    try {
        const deleted = await Objetivo.destroy({
            where: { id_objetivo: id_objetivo, id_usuario: userId }
        });
        return deleted
    } catch (error) {
        throw error;
    }
};