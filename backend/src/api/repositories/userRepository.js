const db = require('../../config/database');
const Usuario = db.Usuario;

class UserRepository {
    constructor() {
        this.model = Usuario;
    }

    async findAll() {
        return await this.model.findAll();
    }

    async findById(userId) {
        return await this.model.findByPk(userId);
    }

    async findByEmail(email) {
        return await this.model.findOne({ where: { correo_electronico: email } });
    }

    async create(userData) {
        return await this.model.create(userData);
    }

    async update(userId, updatedData) {
        const [updatedRowsCount] = await this.model.update(updatedData, {
            where: { id: userId },
            // returning: true, // Esto solo funciona con ciertos dialectos como PostgreSQL
        });
        if (updatedRowsCount > 0) {
            return await this.findById(userId); // Retorna el usuario actualizado
        }
        return null; // O lanzar un error si se esperaba una actualización
    }

    async delete(userId) {
        return await this.model.destroy({
            where: { id: userId }
        });
    }
}

module.exports = new UserRepository();