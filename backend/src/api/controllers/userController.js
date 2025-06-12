// backend/src/api/controllers/userController.js
const userService = require('../services/userService');
const objectivesService = require('../services/objectivesService'); // Mantenemos para el flag `hasObjectives`
const AppError = require('../../utils/AppError');

/**
 * Utility function to get the authenticated user ID from the request object.
 * Throws an AppError if the user ID is not found.
 * @param {object} req - The Express request object.
 * @returns {number} The user ID.
 */
const getAuthUserId = (req) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError('Error de autenticación: ID de usuario no encontrado en la petición.', 401);
    }
    return userId;
};


// --- Authentication Controllers ---

/**
 * Handles user registration. Creates a user and returns a JWT.
 */
exports.register = async (req, res, next) => {
    try {
        const newUser = await userService.createUser(req.body);
        const token = userService.generateAuthToken(newUser);
        
        const { password, ...userForResponse } = newUser.toJSON();

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado con éxito.',
            token,
            user: userForResponse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user login. Validates credentials and returns a JWT.
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await userService.login(email, password);
        
        const hasObjectives = await objectivesService.userHasObjectives(user.id);

        res.status(200).json({
            status: 'success',
            message: 'Inicio de sesión exitoso.',
            token,
            user: { ...user, hasObjectives }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user logout.
 * En una implementación basada en JWT, esto es principalmente simbólico.
 * Se podría añadir lógica de blacklisting de tokens si fuera necesario.
 */
exports.logout = (req, res, next) => {
    // Aquí podría ir la lógica para invalidar el token en el servidor si se implementa una blacklist.
    res.status(200).json({ status: 'success', message: 'Sesión cerrada con éxito.' });
};


// --- Admin/CRUD Controllers ---

/**
 * Creates a user (e.g., by an admin). Does not return a token.
 */
exports.createUser = async (req, res, next) => {
    try {
        const newUser = await userService.createUser(req.body);
        const { password, ...userForResponse } = newUser.toJSON();
        res.status(201).json({
            status: 'success',
            data: { user: userForResponse }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Gets a single user by their ID.
 * Ensures the authenticated user can only get their own profile.
 */
exports.getUserById = async (req, res, next) => {
    try {
        const authUserId = getAuthUserId(req);
        const requestedUserId = req.params.id;

        if (String(authUserId) !== String(requestedUserId)) {
            return next(new AppError('Acceso denegado. No puedes obtener información de otros usuarios.', 403));
        }

        const user = await userService.getUserById(requestedUserId);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates a user.
 * Ensures the authenticated user can only update their own profile.
 */
exports.updateUser = async (req, res, next) => {
    try {
        const authUserId = getAuthUserId(req);
        const userIdToUpdate = req.params.id;

        if (String(authUserId) !== String(userIdToUpdate)) {
            return next(new AppError('Acceso denegado. No puedes actualizar la información de otros usuarios.', 403));
        }
        
        const updatedUser = await userService.updateUser(userIdToUpdate, req.body);
        res.status(200).json({
            status: 'success',
            message: 'Usuario actualizado con éxito.',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes a user.
 * Ensures the authenticated user can only delete their own profile.
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const authUserId = getAuthUserId(req);
        const userIdToDelete = req.params.id;

        if (String(authUserId) !== String(userIdToDelete)) {
            return next(new AppError('Acceso denegado. No puedes eliminar a otros usuarios.', 403));
        }
        
        await userService.deleteUser(userIdToDelete);
        res.status(204).send(); // No Content
    } catch (error) {
        next(error);
    }
};