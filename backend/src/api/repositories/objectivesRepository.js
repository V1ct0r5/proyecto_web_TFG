// backend/src/api/repositories/objectiveRepository.js
const db = require('../../config/database');
const Objetivo = db.Objetivo; // Usar el nombre del modelo tal como se define en db.Objetivo
// const Progress = db.Progress; // No se usa directamente en este repositorio

class ObjectiveRepository {
    constructor() {
        this.model = Objetivo; // El modelo principal que este repositorio gestiona
    }

    /**
     * Obtiene todos los objetivos para un usuario específico.
     * @param {number} userId El ID del usuario.
     * @returns {Promise<Array<Objetivo>>} Una promesa que resuelve con un array de objetivos.
     */
    async findAll(userId) {
        return await this.model.findAll({ where: { id_usuario: userId } });
    }

    /**
     * Busca un objetivo por su ID y el ID del usuario, con opciones de inclusión.
     * @param {number} objectiveId El ID del objetivo.
     * @param {number} userId El ID del usuario.
     * @param {object} options Opciones adicionales para la consulta de Sequelize (ej. `include`).
     * @returns {Promise<Objetivo|null>} Una promesa que resuelve con el objetivo encontrado o null.
     */
    async findById(objectiveId, userId, options = {}) {
        return await this.model.findOne({
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
    }

    /**
     * Crea un nuevo objetivo en la base de datos.
     * @param {object} objectiveData Los datos del objetivo a crear.
     * @param {object} options Opciones adicionales para la operación de creación (ej. `transaction`).
     * @returns {Promise<Objetivo>} Una promesa que resuelve con el objetivo creado.
     */
    async create(objectiveData, options = {}) {
        return await this.model.create(objectiveData, options);
    }

    /**
     * Actualiza un objetivo existente.
     * @param {number} objectiveId El ID del objetivo a actualizar.
     * @param {number} userId El ID del usuario al que pertenece el objetivo.
     * @param {object} updatedData Los datos a actualizar.
     * @param {object} options Opciones adicionales para la operación de actualización (ej. `transaction`).
     * @returns {Promise<number>} Una promesa que resuelve con el número de filas actualizadas.
     */
    async update(objectiveId, userId, updatedData, options = {}) {
        const [updatedRows] = await this.model.update(updatedData, {
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
        return updatedRows;
    }

    /**
     * Elimina un objetivo de la base de datos.
     * @param {number} objectiveId El ID del objetivo a eliminar.
     * @param {number} userId El ID del usuario al que pertenece el objetivo.
     * @param {object} options Opciones adicionales para la operación de eliminación (ej. `transaction`).
     * @returns {Promise<number>} Una promesa que resuelve con el número de filas eliminadas (1 si se eliminó, 0 si no).
     */
    async delete(objectiveId, userId, options = {}) {
        return await this.model.destroy({
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
    }
}

module.exports = new ObjectiveRepository();