const db = require('../../config/database');

exports.obtenerObjetivos = async (userId, transaction = null) => {
    try {
        const objetivos = await db.Objective.findAll({
            where: { id_usuario: userId },
        }, { transaction });
        return objetivos;
    } catch (error) {
        console.error('Error al obtener objetivos:', error);
        throw new Error('Error al obtener los objetivos: ' + error.message);
    }
};

exports.crearObjetivo = async (objetivoData, transaction = null) => {
    try {
        const nuevoObjetivo = await db.Objective.create(objetivoData, { transaction });
        return nuevoObjetivo;
    } catch (error) {
        console.error('Error al crear objetivo:', error);
        if (error.name === 'SequelizeValidationError') {
            throw error;
        }
        throw new Error('Error al crear el objetivo: ' + error.message)
    }
};

exports.obtenerObjetivoPorId = async (id_objetivo, userId, transaction = null) => {
    try {
        const objetivo = await db.Objective.findOne({
            where: {
                id_objetivo: id_objetivo,
                id_usuario: userId,
            },
        }, { transaction });

        return objetivo;
    } catch (error) {
        console.error('Error al obtener el objetivo:', error);
        throw new Error('Error al obtener el objetivo por ID: ' + error.message);
    }
};


exports.actualizarObjetivo = async (id_objetivo, objetivoData, userId, transaction = null) => {
    try {
        const [updatedCount] = await db.Objective.update(objetivoData, {
            where: { id_objetivo: id_objetivo, id_usuario: userId },
            transaction,
            returning: true,
        });

         if (updatedCount > 0) {
             const objetivoActualizado = await db.Objective.findByPk(id_objetivo, {
                 where: { id_usuario: userId },
                 transaction
             });
             return objetivoActualizado;
         }



        return null;
    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
         if (error.name === 'SequelizeValidationError') {
             throw error;
         }
        throw new Error('Error al actualizar el objetivo: ' + error.message);
    }
};

exports.eliminarObjetivo = async (id_objetivo, userId, transaction = null) => {
    try {
        const deletedCount = await db.Objective.destroy({
            where: {
                id_objetivo: id_objetivo,
                id_usuario: userId,
            },
        }, { transaction });

        if (deletedCount === 0) {
            return 0;
        }

        return deletedCount;

    } catch (error) {
        console.error('Error al eliminar objetivo:', error);
        throw new Error('Error al eliminar el objetivo: ' + error.message);
    }
};