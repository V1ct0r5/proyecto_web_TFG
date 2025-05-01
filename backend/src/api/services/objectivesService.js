// const Objetivo = require('../models/objectives'); // Eliminar o comentar
const db = require('../../config/database'); // Importar el objeto db

exports.obtenerObjetivos = async (userId) => {
    try {
        return await db.Objective.findAll({ where: { id_usuario: userId } });
    } catch (error) {
        console.error('Error al obtener objetivos:', error);
        throw new Error('Error al obtener los objetivos: ' + error.message);
    }
};

exports.crearObjetivo = async (objetivoData) => {
    try {
        return await db.Objective.create(objetivoData);
    } catch (error) {
        console.error('Error al crear objetivo:', error);
        throw new Error('Error al crear el objetivo: ' + error.message)
    }
};

exports.obtenerObjetivoPorId = async (id_objetivo, userId) => {
    try {
        return await db.Objective.findByPk(id_objetivo, { where: { id_usuario: userId } });
    } catch (error) {
        console.error('Error al obtener objetivo por ID:', error);
        throw new Error('Error al obtener el objetivo por ID: ' + error.message);
    }
};

exports.actualizarObjetivo = async (id_objetivo, objetivoData, userId) => {
    try {
        const [updated] = await db.Objective.update(objetivoData, {
            where: { id_objetivo: id_objetivo, id_usuario: userId }
        });
        if(updated){
            return await db.Objective.findByPk(id_objetivo, { where: { id_usuario: userId } });
        }
        return null;
    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
        throw new Error('Error al actualizar el objetivo: ' + error.message);
    }
};

exports.eliminarObjetivo = async (id_objetivo, userId) => {
    try {
        const deleted = await db.Objective.destroy({
            where: { id_objetivo: id_objetivo, id_usuario: userId }
        });
        return deleted
    } catch (error) {
        console.error('Error al eliminar objetivo:', error);
        throw new Error('Error al eliminar el objetivo: ' + error.message);
    }
};