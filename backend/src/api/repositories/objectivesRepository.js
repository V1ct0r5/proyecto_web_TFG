// backend/src/api/repositories/objectiveRepository.js
const db = require('../../config/database');
const { Op } = require('sequelize');
const Objetivo = db.Objetivo;

class ObjectiveRepository {
    constructor() {
        this.model = Objetivo;
    }

    async findAll(userId, filters = {}) {
        const whereClause = { id_usuario: userId };

        // Si 'includeArchived' es falso o no se proporciona, excluimos los archivados.
        if (String(filters.includeArchived).toLowerCase() !== 'true') {
            whereClause.estado = { [Op.not]: 'Archivado' };
        }
        
        if (filters.category && filters.category !== 'all') {
            whereClause.tipo_objetivo = filters.category;
        }

        if (filters.searchTerm) {
            whereClause[Op.or] = [
                { nombre: { [Op.like]: `%${filters.searchTerm}%` } },
                { descripcion: { [Op.like]: `%${filters.searchTerm}%` } }
            ];
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // Lógica de ordenación actualizada para usar claves neutrales
        let orderClause = [['updatedAt', 'DESC']]; // Orden por defecto
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'recent': // antes 'recientes'
                    orderClause = [['updatedAt', 'DESC']];
                    break;
                case 'oldest': // antes 'antiguos'
                    orderClause = [['updatedAt', 'ASC']];
                    break;
                case 'nameAsc':
                    orderClause = [['nombre', 'ASC']];
                    break;
                case 'nameDesc':
                    orderClause = [['nombre', 'DESC']];
                    break;
                 case 'dateAsc': // antes 'fechaFinAsc'
                    orderClause = [['fecha_fin', 'ASC']];
                    break;
                // Los casos de progreso ('progressAsc', 'progressDesc') se manejan en el servicio
                // después de calcular el progreso, ya que no es un campo de la DB.
            }
        }
        // --- FIN DE LA CORRECCIÓN ---

        return await this.model.findAll({ 
            where: whereClause,
            order: orderClause
        });
    }

    async findById(objectiveId, userId, options = {}) {
        return await this.model.findOne({
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
    }

    async create(objectiveData, options = {}) {
        return await this.model.create(objectiveData, options);
    }

    async update(objectiveId, userId, updatedData, options = {}) {
        const [updatedRows] = await this.model.update(updatedData, {
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
        return updatedRows;
    }

    async delete(objectiveId, userId, options = {}) {
        return await this.model.destroy({
            where: { id_objetivo: objectiveId, id_usuario: userId },
            ...options
        });
    }
}

module.exports = new ObjectiveRepository();