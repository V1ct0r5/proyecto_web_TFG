// backend\src\api\repositories\objectiveRepository.js
const db = require('../../config/database');
const Objective = db.Objective; // Accedemos al modelo Objective

class ObjectiveRepository {
    constructor() {
        this.model = Objective;
    }

    async findAll(userId) {
        return await this.model.findAll({ where: { id_usuario: userId } });
    }

    async findById(objectiveId, userId) {
        return await this.model.findOne({
            where: { id_objetivo: objectiveId, id_usuario: userId } // CORREGIDO: Usar id_objetivo
        });
    }

    async create(objectiveData) {
        return await this.model.create(objectiveData);
    }

    async update(objectiveId, userId, updatedData) {
        const [updatedRows] = await this.model.update(updatedData, {
            where: { id_objetivo: objectiveId, id_usuario: userId } // CORREGIDO: Usar id_objetivo
        });
        if (updatedRows > 0) {
            return await this.findById(objectiveId, userId); // Retorna el objetivo actualizado
        }
        return null;
    }

    async delete(objectiveId, userId) {
        return await this.model.destroy({
            where: { id_objetivo: objectiveId, id_usuario: userId } // CORREGIDO: Usar id_objetivo
        });
    }

    // Aquí podrías añadir métodos más complejos que encapsulen lógica de consulta
    // Por ejemplo:
    // async findObjectivesByStatus(userId, status) {
    //      return await this.model.findAll({ where: { id_usuario: userId, estado: status } });
    // }
}

module.exports = new ObjectiveRepository(); // Exporta una instancia singleton