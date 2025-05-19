// backend/src/api/controllers/userController.js
const userService = require('../services/userService');
const { validationResult } = require('express-validator');
const db = require('../../config/database');
const Objetivo = db.Objective;

exports.obtenerUsuarios = async (req, res) => {
    const transaction = req.transaction;

    try {
        const usuarios = await userService.obtenerUsuarios(transaction);

        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios', message: error.message });
    }
};


exports.crearUsuario = async (req, res) => {
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        res.status(201).json(usuarioSinContrasena);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: error.errors[0].message || 'El correo electrónico ya está en uso' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message || 'Error de validación' });
        }
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ error: error.message || 'Error interno al crear el usuario' });
    }
}


exports.obtenerUsuarioPorId = async (req, res) => {
    const userIdAuth = req.user;
    const userIdParam = req.params.id;


    const transaction = req.transaction;

    try {
        const usuario = await userService.obtenerUsuarioPorId(userIdParam, transaction);

        if (!usuario) {
            console.log('Controller: obtenerUsuarioPorId - Usuario no encontrado (404)');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }


        res.status(200).json(usuario);

    } catch (error) {
        console.error('Error al obtener el usuario por ID:', error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
}


exports.actualizarUsuario = async (req, res) => {
    const userIdAuth = req.user;
    const userIdToUpdate = req.params.id;
    const usuarioData = req.body;


    const transaction = req.transaction;

    try {
        const usuarioActualizado = await userService.actualizarUsuario(userIdToUpdate, usuarioData, transaction);

        if (!usuarioActualizado) {
            console.log('Controller: actualizarUsuario - Usuario no encontrado (404)');
            return res.status(404).json({ error: 'Usuario no encontrado o no pudo ser actualizado' });
        }


        res.status(200).json(usuarioActualizado);

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: error.errors[0].message || 'El correo electrónico ya está en uso' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message || 'Error de validación' });
        }
        res.status(500).json({ error: 'Error al actualizar el usuario', message: error.message });
    }
}

exports.eliminarUsuario = async (req, res) => {
    const userIdAuth = req.user;
    const userIdToDelete = req.params.id;


    const transaction = req.transaction;

    try {
        const deletedCount = await userService.eliminarUsuario(userIdToDelete, transaction);


        if (deletedCount === 0) {
            console.log('Controller: eliminarUsuario - Usuario no encontrado (404)');
            return res.status(404).json({ error: 'Usuario no encontrado o no pudo ser eliminado' });
        }

        res.status(204).send();

    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario', message: error.message });
    }
}


exports.registrarUsuario = async (req, res) => {
    const usuarioData = req.body;


    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);


        const token = userService.generarAutenticacionToken(nuevoUsuario);


        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();


        res.status(201).json({ ...usuarioSinContrasena, token });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);


        if (error.name === 'SequelizeUniqueConstraintError' || (error.errors && error.errors[0].path === 'correo_electronico')) {
            return res.status(409).json({ error: error.message || 'El correo electrónico ya está en uso' });
        }
        if (error.name === 'SequelizeValidationError' || (error.errors && error.errors.length > 0)) {
            return res.status(400).json({ error: error.message || 'Error de validación en los datos proporcionados' });
        }
        res.status(500).json({ message: 'Error interno al registrar el usuario' });
    }
}

exports.iniciarSesionUsuario = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;


    try {
        const usuario = await userService.loginUsuario(correo_electronico, contrasena);
        const token = userService.generarAutenticacionToken(usuario);
        const userId = usuario.id;
        const { contrasena: _, ...usuarioSinContrasena } = usuario.toJSON();

        const objectivesCount = await Objetivo.count({
            where: {
                id_usuario: userId // Filtrar por el ID del usuario logueado
            }
        });

        const hasObjectives = objectivesCount > 0;

        res.status(200).json({ usuario: usuarioSinContrasena, token, hasObjectives });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        if (error.message === 'Correo electrónico o contraseña incorrectos') {
            res.status(401).json({ message: error.message });
        } else {
            console.error('Controller: iniciarSesionUsuario - Error inesperado durante login:', error);
            res.status(500).json({ message: 'Error interno al iniciar sesión' });
        }
    }
};

exports.cerrarSesionUsuario = async (req, res) => {
    try {
        res.status(200).json({ message: 'Sesión cerrada exitosamente (en el frontend)' });

    } catch (error) {
        console.error('Error en controlador logout:', error);
        res.status(500).json({ error: 'Error al intentar cerrar sesión en el servidor' });
    }
};