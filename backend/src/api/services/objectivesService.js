const db = require('../../config/database');

exports.crearObjetivo = async (objectiveData, transaction = null) => {
    try {
        const nuevoObjetivo = await db.Objective.create(objectiveData, { transaction });
        console.log("Objetivo creado en servicio:", nuevoObjetivo.toJSON());
        return nuevoObjetivo;
    } catch (error) {
        console.error('Error al crear objetivo:', error);
        throw new Error('Error al crear el objetivo: ' + error.message);
    }
};

exports.obtenerObjetivos = async (userId, transaction = null) => {
    try {
        const objetivos = await db.Objective.findAll({
            where: { id_usuario: userId },
        }, { transaction });
        console.log("Objetivos obtenidos de Sequelize (Servicio, antes de parsear):", objetivos);

        // <-- Añadir lógica de parsing manual aquí -->
        const objetivosParseados = objetivos.map(objetivo => {
            const objetivoPlain = objetivo.toJSON(); // Obtener un objeto JavaScript plano
            
            // Parsear valor_actual si no es null
            if (objetivoPlain.valor_actual !== null && typeof objetivoPlain.valor_actual === 'string') {
                const parsed = parseFloat(objetivoPlain.valor_actual);
                objetivoPlain.valor_actual = !isNaN(parsed) ? parsed : null; // Usar null si el parsing falla
            } else if (objetivoPlain.valor_actual === undefined) {
                objetivoPlain.valor_actual = null; // Asegurar que undefined se convierta a null
            }


            // Parsear valor_cuantitativo si no es null
            if (objetivoPlain.valor_cuantitativo !== null && typeof objetivoPlain.valor_cuantitativo === 'string') {
                const parsed = parseFloat(objetivoPlain.valor_cuantitativo);
                objetivoPlain.valor_cuantitativo = !isNaN(parsed) ? parsed : null; // Usar null si el parsing falla
            } else if (objetivoPlain.valor_cuantitativo === undefined) {
                objetivoPlain.valor_cuantitativo = null; // Asegurar que undefined se convierta a null
            }


            return objetivoPlain;
        });

        console.log("Objetivos obtenidos de Servicio (después de parsear):", objetivosParseados);
        return objetivosParseados; // Devolver los objetos parseados
    } catch (error) {
        console.error('Error al obtener objetivos:', error);
        throw new Error('Error al obtener los objetivos: ' + error.message);
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
        console.log("Objetivo obtenido por ID de Sequelize (Servicio, antes de parsear):", objetivo);

        if (!objetivo) {
            return null; // Objetivo no encontrado
        }

        // <-- Añadir lógica de parsing manual aquí para un solo objetivo -->
        const objetivoParseado = objetivo.toJSON();

        if (objetivoParseado.valor_actual !== null && typeof objetivoParseado.valor_actual === 'string') {
            const parsed = parseFloat(objetivoParseado.valor_actual);
            objetivoParseado.valor_actual = !isNaN(parsed) ? parsed : null;
        } else if (objetivoParseado.valor_actual === undefined) {
            objetivoParseado.valor_actual = null;
        }


        if (objetivoParseado.valor_cuantitativo !== null && typeof objetivoParseado.valor_cuantitativo === 'string') {
            const parsed = parseFloat(objetivoParseado.valor_cuantitativo);
            objetivoParseado.valor_cuantitativo = !isNaN(parsed) ? parsed : null;
        } else if (objetivoParseado.valor_cuantitativo === undefined) {
            objetivoParseado.valor_cuantitativo = null;
        }

        console.log("Objetivo obtenido por ID de Servicio (después de parsear):", objetivoParseado);
        return objetivoParseado; // Devolver el objeto parseado

    } catch (error) {
        console.error('Error al obtener objetivo por ID:', error);
        throw new Error('Error al obtener el objetivo por ID: ' + error.message);
    }
};


// Puedes añadir otras funciones de servicio aquí (actualizar, eliminar, etc.)
exports.actualizarObjetivo = async (id_objetivo, userId, updateData, transaction = null) => {
    try {
        // Opcional: Parsear valor_actual y valor_cuantitativo en updateData si llegan como strings al servicio
        // Aunque si se envían desde el frontend con valueAsNumber en react-hook-form, ya deberían ser números aquí.

        const [affectedCount, affectedRows] = await db.Objective.update(updateData, {
            where: { id_objetivo: id_objetivo, id_usuario: userId },
            returning: true, // Para PostgreSQL/MSSQL, devuelve los objetos actualizados
            // model: db.Objective // Para MySQL, puede ser necesario
        }, { transaction });

         // Para MySQL, retrieving: true no funciona. Debemos obtener el objeto actualizado por separado si es necesario.
        if (affectedCount > 0) {
             const objetivoActualizado = await exports.obtenerObjetivoPorId(id_objetivo, userId, transaction); // Reutilizamos la función de obtener por ID que ya parsea
             return objetivoActualizado; // Devolver el objeto actualizado (ya parseado)
        }


        return null; // No se encontró o actualizó el objetivo

    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
        throw new Error('Error al actualizar el objetivo: ' + error.message);
    }
};

exports.eliminarObjetivo = async (id_objetivo, userId, transaction = null) => {
    try {
        const affectedCount = await db.Objective.destroy({
            where: { id_objetivo: id_objetivo, id_usuario: userId },
        }, { transaction });

        return affectedCount > 0; // Devuelve true si se eliminó al menos un objetivo
    } catch (error) {
        console.error('Error al eliminar objetivo:', error);
        throw new Error('Error al eliminar el objetivo: ' + error.message);
    }
};