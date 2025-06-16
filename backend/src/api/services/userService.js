// backend/src/api/services/userService.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRepository = require('../repositories/userRepository');
const AppError = require('../../utils/AppError');

// --- Service-level Constants for Error Messages ---
const AUTH_CONFIG_ERROR = 'Error de configuración interna del servidor.';
const INVALID_CREDENTIALS_ERROR = 'El correo electrónico o la contraseña son incorrectos.';

/**
 * Service layer for user-related business logic.
 */
class UserService {
    /**
     * Retrieves a user by their ID.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<User>} The user object without the password.
     */
    async getUserById(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado.', 404);
        }
        // Excluir la contraseña en el objeto devuelto
        const { password, ...userWithoutPassword } = user.toJSON();
        return userWithoutPassword;
    }

    /**
     * Creates a new user.
     * @param {object} userData - User data (username, email, password).
     * @returns {Promise<User>} The newly created user object.
     */
    async createUser(userData) {
        // Validación para evitar duplicados de correo electrónico o nombre de usuario.
        if (await userRepository.findByEmail(userData.email)) {
            throw new AppError('El correo electrónico proporcionado ya está registrado.', 409);
        }
        if (await userRepository.findByUsername(userData.username)) {
            throw new AppError('El nombre de usuario ya está en uso.', 409);
        }

        // Pasa los datos directamente al repositorio. El hook del modelo se encargará de hashear la contraseña.
        // NO SE HASHEA LA CONTRASEÑA AQUÍ para evitar el doble hasheo.
        const newUser = await userRepository.create(userData);
        return newUser;
    }

    /**
     * Authenticates a user and returns a JWT.
     * @param {string} email - User's email.
     * @param {string} password - User's password.
     * @returns {Promise<{token: string, user: object}>} An object with the token and user data.
     */
    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AppError(INVALID_CREDENTIALS_ERROR, 401);
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw new AppError(INVALID_CREDENTIALS_ERROR, 401);
        }

        const token = this.generateAuthToken(user);
        const { password: _, ...userWithoutPassword } = user.toJSON();
        
        return { token, user: userWithoutPassword };
    }

    /**
     * Updates a user's information.
     * @param {number} userId - The ID of the user to update.
     * @param {object} userData - The data to update.
     * @returns {Promise<User>} The updated user object.
     */
    async updateUser(userId, userData) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar.', 404);
        }

        // Si se actualiza la contraseña, se pasa en texto plano. El hook del modelo la hasheará.
        const updatedCount = await userRepository.update(userId, userData);

        if (updatedCount > 0) {
            // Refresca los datos del usuario para devolver el objeto actualizado.
            const updatedUser = await this.getUserById(userId);
            return updatedUser;
        }
        
        // Si no se actualizó ninguna fila, devuelve el usuario sin cambios.
        const { password, ...userWithoutPassword } = user.toJSON();
        return userWithoutPassword;
    }

    /**
     * Deletes a user.
     * @param {number} userId - The ID of the user to delete.
     * @returns {Promise<{message: string}>} A confirmation message.
     */
    async deleteUser(userId) {
        const deletedCount = await userRepository.delete(userId);
        if (deletedCount === 0) {
            throw new AppError('Usuario no encontrado para eliminar.', 404);
        }
        return { message: 'Usuario eliminado con éxito.' };
    }

    /**
     * Generates a JWT for a given user.
     * @param {User} user - The user instance.
     * @returns {string} The generated JWT.
     */
    generateAuthToken(user) {
        const payload = { id: user.id, username: user.username, email: user.email };
        const secret = process.env.NODE_ENV === 'test' 
            ? process.env.JWT_SECRET_TEST 
            : process.env.JWT_SECRET;
        const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };

        if (!secret) {
            console.error("FATAL: JWT_SECRET no está definido en las variables de entorno.");
            throw new AppError(AUTH_CONFIG_ERROR, 500);
        }
        
        return jwt.sign(payload, secret, options);
    }
}

module.exports = new UserService();