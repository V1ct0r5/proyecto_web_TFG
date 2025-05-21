const db = require('../../config/database');
const User = db.User;

class UserRepository {
    constructor() {
        this.model = User;
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
        const [updatedRows] = await this.model.update(updatedData, {
            where: { id: userId }
        });
        if (updatedRows > 0) {
            return await this.findById(userId); // Retorna el usuario actualizado
        }
        return null;
    }

    async delete(userId) {
        return await this.model.destroy({
            where: { id: userId }
        });
    }
}

module.exports = new UserRepository();