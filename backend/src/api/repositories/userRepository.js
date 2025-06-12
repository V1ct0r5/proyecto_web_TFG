// backend/src/api/repositories/userRepository.js
const db = require('../../config/database');

/**
 * Repository for User data operations.
 * Encapsulates all database access logic for the User model.
 */
class UserRepository {
    constructor() {
        this.model = db.User; // Usa el modelo refactorizado
    }

    /**
     * Finds a user by their ID.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<User|null>} The user instance or null if not found.
     */
    async findById(userId) {
        return this.model.findByPk(userId);
    }

    /**
     * Finds a user by their email address.
     * @param {string} email - The email of the user.
     * @returns {Promise<User|null>} The user instance or null if not found.
     */
    async findByEmail(email) {
        return this.model.findOne({ where: { email } });
    }
    
    /**
     * Finds a user by their username.
     * @param {string} username - The username of the user.
     * @returns {Promise<User|null>} The user instance or null if not found.
     */
    async findByUsername(username) {
        return this.model.findOne({ where: { username } });
    }

    /**
     * Creates a new user.
     * @param {object} userData - The data for the new user.
     * @returns {Promise<User>} The newly created user instance.
     */
    async create(userData) {
        return this.model.create(userData);
    }

    /**
     * Updates a user's data.
     * @param {number} userId - The ID of the user to update.
     * @param {object} updatedData - The new data for the user.
     * @returns {Promise<number>} The number of updated rows (0 or 1).
     */
    async update(userId, updatedData) {
        const [updatedRowsCount] = await this.model.update(updatedData, {
            where: { id: userId },
        });
        return updatedRowsCount;
    }

    /**
     * Deletes a user by their ID.
     * @param {number} userId - The ID of the user to delete.
     * @returns {Promise<number>} The number of deleted rows (0 or 1).
     */
    async delete(userId) {
        return this.model.destroy({ where: { id: userId } });
    }
}

module.exports = new UserRepository();