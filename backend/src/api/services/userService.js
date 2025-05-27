// backend/src/api/services/userService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar variables de entorno

const userRepository = require('../repositories/userRepository');
const AppError = require('../../utils/AppError'); // Clase de error personalizada

// Constantes para mensajes de error comunes
const INVALID_CREDENTIALS_MESSAGE = 'Correo electrónico o contraseña incorrectos.';
const AUTH_CONFIG_ERROR_MESSAGE = 'Error de configuración interna: JWT_SECRET no está definido.';
const TOKEN_EXPIRED_MESSAGE = 'Token expirado. Por favor, inicia sesión de nuevo.';
const TOKEN_INVALID_MESSAGE = 'Token inválido o la autenticación ha fallado.';
const TOKEN_VERIFICATION_ERROR_MESSAGE = 'Error al verificar la autenticación del token.';

exports.obtenerUsuarios = async () => {
    try {
        return await userRepository.findAll();
    } catch (error) {
        // Errores de base de datos se propagan para ser manejados por el errorHandler global
        throw error; 
    }
};

exports.crearUsuario = async (usuarioData) => {
    try {
        const hashedPassword = await bcrypt.hash(usuarioData.contrasena, 10);
        const newUser = await userRepository.create({
            nombre_usuario: usuarioData.nombre_usuario,
            correo_electronico: usuarioData.correo_electronico,
            contrasena: hashedPassword
        });
        // El controlador decidirá qué datos del usuario devolver (sin la contraseña)
        return newUser;
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.fields && Object.keys(error.fields).length > 0 ? Object.keys(error.fields)[0] : 'un campo';
            let friendlyMessage = `El valor para '${field}' ya está en uso.`;
            if (field === 'correo_electronico') {
                friendlyMessage = 'El correo electrónico proporcionado ya está registrado.';
            } else if (field === 'nombre_usuario') {
                friendlyMessage = 'El nombre de usuario proporcionado ya está en uso.';
            }
            throw new AppError(friendlyMessage, 409); // 409 Conflict
        }
        throw error; // Para otros errores, propagar al errorHandler
    }
};

exports.obtenerUsuarioPorId = async (id) => {
    try {
        const usuario = await userRepository.findById(id);
        if (!usuario) {
            throw new AppError('Usuario no encontrado.', 404);
        }
        return usuario;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw error;
    }
};

exports.actualizarUsuario = async (id, usuarioData) => {
    try {
        const usuarioExistente = await userRepository.findById(id);
        if (!usuarioExistente) {
            throw new AppError('Usuario no encontrado para actualizar.', 404);
        }

        const datosActualizar = { ...usuarioData };
        if (usuarioData.contrasena) {
            datosActualizar.contrasena = await bcrypt.hash(usuarioData.contrasena, 10);
        }

        const [updatedRowsCount, updatedUsersArray] = await userRepository.update(id, datosActualizar);
        
        if (updatedRowsCount === 0 && usuarioExistente) {
            return usuarioExistente; 
        }
        return updatedUsersArray && updatedUsersArray.length > 0 ? updatedUsersArray[0] : usuarioExistente;
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.fields && Object.keys(error.fields).length > 0 ? Object.keys(error.fields)[0] : 'un campo';
            throw new AppError(`El nuevo valor para '${field}' ya está en uso por otro usuario.`, 409);
        }
        if (error instanceof AppError) throw error;
        throw error;
    }
};

exports.eliminarUsuario = async (id) => {
    try {
        const deletedCount = await userRepository.delete(id);
        if (deletedCount === 0) {
            throw new AppError('Usuario no encontrado para eliminar.', 404);
        }
        return { message: 'Usuario eliminado con éxito.', count: deletedCount };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw error;
    }
};

exports.generarTokenAutenticacion = (usuario) => {
    const payload = { 
        id: usuario.id, 
        correo_electronico: usuario.correo_electronico, 
        nombre_usuario: usuario.nombre_usuario 
    };
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError(AUTH_CONFIG_ERROR_MESSAGE, 500);
    }
    return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
};

exports.loginUsuario = async (correo_electronico, contrasena) => {
    try {
        const usuarioInstance = await userRepository.findByEmail(correo_electronico);
        if (!usuarioInstance) {
            throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
        }

        const isMatch = await bcrypt.compare(contrasena, usuarioInstance.contrasena);
        if (!isMatch) {
            throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
        }

        const token = this.generarTokenAutenticacion(usuarioInstance);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioInstance.toJSON ? usuarioInstance.toJSON() : usuarioInstance;

        return { token, usuario: usuarioSinContrasena }; 
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Error interno durante el proceso de inicio de sesión.', 500); 
    }
};

exports.verificarAutenticacionToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new AppError(AUTH_CONFIG_ERROR_MESSAGE, 500);
    }

    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(TOKEN_EXPIRED_MESSAGE, 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError(TOKEN_INVALID_MESSAGE, 403);
        }
        throw new AppError(TOKEN_VERIFICATION_ERROR_MESSAGE, 500); 
    }
};