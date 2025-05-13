// backend/src/api/services/objectivesService.js
const db = require('../../config/database');

// Función para obtener todos los objetivos de un usuario
// Acepta transaction y la pasa a findAll
exports.obtenerObjetivos = async (userId, transaction = null) => {
    // console.log('Service: obtenerObjetivos - userId:', userId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        const objetivos = await db.Objective.findAll({
            where: { id_usuario: userId },
        }, { transaction }); // <--- Pasa la transacción
        // console.log('Service: obtenerObjetivos - Resultado:', objetivos ? `${objetivos.length} objetivos encontrados` : 'null'); // Log de depuración
        return objetivos;
    } catch (error) {
        console.error('Error al obtener objetivos:', error);
        throw new Error('Error al obtener los objetivos: ' + error.message);
    }
};

// Función para crear un nuevo objetivo
// Acepta transaction y la pasa a create
exports.crearObjetivo = async (objetivoData, transaction = null) => {
    // console.log('Service: crearObjetivo - objetivoData:', objetivoData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        const nuevoObjetivo = await db.Objective.create(objetivoData, { transaction }); // <--- Pasa la transacción
        // console.log('Service: crearObjetivo - Resultado:', nuevoObjetivo ? `Objetivo ID ${nuevoObjetivo.id_objetivo} creado` : 'null'); // Log de depuración
        return nuevoObjetivo; // Devuelve la instancia creada
    } catch (error) {
        console.error('Error al crear objetivo:', error);
         // Relanza errores específicos de Sequelize si es necesario
         if (error.name === 'SequelizeValidationError') {
             throw error; // Lanza el error original
         }
        throw new Error('Error al crear el objetivo: ' + error.message)
    }
};

// Función para obtener un objetivo por ID para un usuario específico
// Acepta transaction y la pasa a findOne (corregido de findByPk)
exports.obtenerObjetivoPorId = async (id_objetivo, userId, transaction = null) => {
    // console.log('Service: obtenerObjetivoPorId - id_objetivo:', id_objetivo, 'userId:', userId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Buscar el objetivo por su ID Y por el ID del usuario para asegurar que pertenece
        // Usar findOne para combinar la búsqueda por clave primaria (implícita en where) y por usuario
        const objetivo = await db.Objective.findOne({ // <--- Cambiado a findOne
            where: {
                id_objetivo: id_objetivo, // Usar el nombre correcto de la columna ID
                id_usuario: userId,
            },
        }, { transaction }); // <--- Pasa la transacción

        // console.log('Service: obtenerObjetivoPorId - Resultado:', objetivo ? `Objetivo ID ${objetivo.id_objetivo} encontrado` : 'null'); // Log de depuración
        return objetivo; // Retorna la instancia si existe y pertenece al usuario, o null si no
    } catch (error) {
        console.error('Error al obtener el objetivo:', error);
        throw new Error('Error al obtener el objetivo por ID: ' + error.message);
    }
};


// Función para actualizar un objetivo
// Acepta transaction y la pasa a update (se puede mejorar buscando primero)
exports.actualizarObjetivo = async (id_objetivo, objetivoData, userId, transaction = null) => {
    // console.log('Service: actualizarObjetivo - id_objetivo:', id_objetivo, 'data:', objetivoData, 'userId:', userId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Opción 1 (Tu código actual): Usar update con where + returning true (si DB lo soporta) o buscar después
        // Esta versión no busca primero para verificar existencia/pertenencia antes del update,
        // solo confía en el where clause del update.
        const [updatedCount] = await db.Objective.update(objetivoData, {
            where: { id_objetivo: id_objetivo, id_usuario: userId },
            transaction, // <--- Pasa la transacción
             returning: true, // Intenta devolver las instancias actualizadas (depende de la DB)
        });

         if (updatedCount > 0) {
             // Si returning: true funcionó, Sequelize ya devolvió las instancias en el 2do elemento del array (que descartamos con [updatedCount])
             // Si no, hay que buscarla de nuevo. Para consistencia, buscamos de nuevo si returning no es fiable o si quieres la instancia completa.
             // console.log('Service: actualizarObjetivo - Filas afectadas por update:', updatedCount); // Log de depuración
             const objetivoActualizado = await db.Objective.findByPk(id_objetivo, {
                 where: { id_usuario: userId }, // Asegura que sigues en el ámbito del usuario
                 transaction // <--- Pasa la transacción a la búsqueda posterior
             });
             // console.log('Service: actualizarObjetivo - Resultado findByPk (después de update):', objetivoActualizado ? `Objetivo ID ${objetivoActualizado.id_objetivo} encontrado` : 'null'); // Log de depuración
             return objetivoActualizado;
         }


        // Opción 2 (Recomendada para mayor claridad y manejo de errores antes de actualizar):
        // Buscar primero, verificar existencia/pertenencia, luego actualizar la instancia.
        /*
        const objetivo = await db.Objective.findOne({
            where: { id_objetivo: id_objetivo, id_usuario: userId },
            transaction // Pasa transaction a findOne
        });

        // console.log('Service: actualizarObjetivo - Resultado findOne (para update):', objetivo ? `Objetivo ID ${objetivo.id_objetivo} encontrado` : 'null'); // Log de depuración

        if (!objetivo) {
             // console.log('Service: actualizarObjetivo - Objetivo no encontrado o no pertenece al usuario para actualizar.'); // Log de depuración
            return null; // Retorna null si no se encontró o no pertenece al usuario
        }

        // Actualizar la instancia, pasando la transacción
        const objetivoActualizado = await objetivo.update(objetivoData, { transaction }); // Pasa transaction a update de instancia
        // console.log('Service: actualizarObjetivo - Resultado update (instancia):', objetivoActualizado ? `Objetivo ID ${objetivoActualizado.id_objetivo} actualizado` : 'null'); // Log de depuración
        return objetivoActualizado; // Devuelve la instancia actualizada
        */
        // Usaremos la Opción 1 (tu código original adaptado) por ahora para minimizar cambios,
        // pero ten en cuenta la Opción 2 como mejora potencial.
        return null; // Si updatedCount es 0
    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
         // Relanza errores específicos de Sequelize si es necesario
         if (error.name === 'SequelizeValidationError') {
             throw error; // Lanza el error original
         }
        throw new Error('Error al actualizar el objetivo: ' + error.message);
    }
};

// Función para eliminar un objetivo
// Acepta transaction y la pasa a destroy
exports.eliminarObjetivo = async (id_objetivo, userId, transaction = null) => {
    // console.log('Service: eliminarObjetivo - id_objetivo:', id_objetivo, 'userId:', userId, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Eliminar el objetivo por su ID Y por el ID del usuario, pasando la transacción
        // destroy devuelve el número de filas afectadas
        const deletedCount = await db.Objective.destroy({
            where: {
                id_objetivo: id_objetivo, // Usar el nombre correcto de la columna ID
                id_usuario: userId,
            },
        }, { transaction }); // <--- Pasa la transacción

        // console.log('Service: eliminarObjetivo - Resultado del destroy (filas afectadas):', deletedCount); // Log de depuración

        if (deletedCount === 0) {
            // console.log('Service: eliminarObjetivo - No se encontró el objetivo para eliminar o no pertenece al usuario.'); // Log de depuración
            return 0; // Retorna 0 si no se eliminó (no encontrado o no pertenece)
        }

        // console.log('Service: eliminarObjetivo - Objetivo eliminado exitosamente.'); // Log de depuración
        return deletedCount; // Retornar 1 si se eliminó exitosamente

    } catch (error) {
        console.error('Error al eliminar objetivo:', error);
        throw new Error('Error al eliminar el objetivo: ' + error.message);
    }
};