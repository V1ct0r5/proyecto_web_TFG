// backend\src\api\services\userService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Asegúrate de que las variables de entorno están cargadas

const userRepository = require('../repositories/userRepository'); // Importa el repositorio
const INVALID_CREDENTIALS_MESSAGE = 'Correo electrónico o contraseña incorrectos';
const AUTH_CONFIG_ERROR_MESSAGE = 'Configuración de autenticación faltante. JWT_SECRET no está definido.';

exports.obtenerUsuarios = async () => {
    try {
        return await userRepository.findAll(); // Usa el repositorio
    } catch (error) {
        console.error('[UserService] Error al obtener usuarios:', error);
        throw error;
    }
};

exports.crearUsuario = async (usuarioData) => {
    try {
        const hashedPassword = await bcrypt.hash(usuarioData.contrasena, 10);
        const newUser = await userRepository.create({ // Usa el repositorio
            nombre_usuario: usuarioData.nombre_usuario,
            correo_electronico: usuarioData.correo_electronico,
            contrasena: hashedPassword
        });
        return newUser;
    } catch (error) {
        console.error('[UserService] Error al crear usuario:', error);
        // Propaga el error para que el controlador lo maneje (ej. UniqueConstraintError)
        throw error;
    }
};

exports.obtenerUsuarioPorId = async (id) => {
    try {
        return await userRepository.findById(id); // Usa el repositorio
    } catch (error) {
        console.error(`[UserService] Error al obtener usuario por ID ${id}:`, error);
        throw error;
    }
};

exports.actualizarUsuario = async (id, updatedData) => {
    try {
        if (updatedData.contrasena) {
            updatedData.contrasena = await bcrypt.hash(updatedData.contrasena, 10);
        }
        const updatedUser = await userRepository.update(id, updatedData); // Usa el repositorio
        return updatedUser;
    } catch (error) {
        console.error(`[UserService] Error al actualizar usuario ${id}:`, error);
        throw error;
    }
};

exports.eliminarUsuario = async (id) => {
    try {
        return await userRepository.delete(id); // Usa el repositorio
    } catch (error) {
        console.error(`[UserService] Error al eliminar usuario ${id}:`, error);
        throw error;
    }
};

exports.loginUsuario = async (correo_electronico, contrasena) => {
    try {
        const user = await userRepository.findByEmail(correo_electronico); // Usa el repositorio

        if (!user) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        const isMatch = await bcrypt.compare(contrasena, user.contrasena);

        if (!isMatch) {
            throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        return user;
    } catch (error) {
        console.error('[UserService] Error al iniciar sesión:', error);
        throw error;
    }
};

exports.generarAutenticacionToken = (user) => {
    const payload = { id: user.id, email: user.correo_electronico };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error(`ERROR: ${AUTH_CONFIG_ERROR_MESSAGE}`);
        throw new Error(AUTH_CONFIG_ERROR_MESSAGE);
    }
    return jwt.sign(payload, secret, { expiresIn: '1h' }); // Tiempo de expiración del token
};

exports.verificarAutenticacionToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error(`ERROR: ${AUTH_CONFIG_ERROR_MESSAGE}`);
        throw new Error(AUTH_CONFIG_ERROR_MESSAGE);
    }

    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error('Service: verificarAutenticacionToken - Error verificando token:', error.message);
        if (error.name === 'TokenExpiredError') {
            const expiredError = new Error('Token expirado');
            expiredError.status = 401; // Usar una propiedad 'status' para manejar en middleware
            throw expiredError;
        }
        if (error.name === 'JsonWebTokenError') {
            const invalidError = new Error('Token inválido');
            invalidError.status = 403; // Usar una propiedad 'status' para manejar en middleware
            throw invalidError;
        }
        const verifyError = new Error('Error verificando token');
        verifyError.status = 500; // Usar una propiedad 'status' para manejar en middleware
        throw verifyError;
    }
};