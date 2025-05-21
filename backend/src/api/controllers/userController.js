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
        console.error('Error en userController.obtenerUsuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los usuarios.' });
    }
};


exports.crearUsuario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        res.status(201).json(usuarioSinContrasena);
    } catch (error) {
        console.error('Error en userController.crearUsuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: error.errors[0].message || 'El correo electrónico ya está en uso' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message || 'Error de validación en los datos del usuario' });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el usuario.' });
    }
}


exports.obtenerUsuarioPorId = async (req, res) => {
    const userIdAuth = req.user;
    const userIdParam = req.params.id;


    const transaction = req.transaction;

    try {
        const usuario = await userService.obtenerUsuarioPorId(userIdParam, transaction);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (userIdAuth !== parseInt(userIdParam)) { // Asumiendo que userIdAuth es un número
            return res.status(403).json({ message: 'Acceso denegado.' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error en userController.obtenerUsuarioPorId:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el usuario.' });
    }
}


exports.actualizarUsuario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userIdAuth = req.user;
    const userIdToUpdate = req.params.id;
    const usuarioData = req.body;


    const transaction = req.transaction;

    try {
        const usuarioActualizado = await userService.actualizarUsuario(userIdToUpdate, usuarioData, transaction);

        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado o no pudo ser actualizado' });
        }

        res.status(200).json(usuarioActualizado);
    } catch (error) {
        console.error('Error en userController.actualizarUsuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: error.errors[0].message || 'El correo electrónico ya está en uso.' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message || 'Error de validación en los datos de actualización.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el usuario.' });
    }
}

exports.eliminarUsuario = async (req, res) => {
    const userIdAuth = req.user;
    const userIdToDelete = req.params.id;


    const transaction = req.transaction;

    try {
        const deletedCount = await userService.eliminarUsuario(userIdToDelete, transaction);


        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado o no pudo ser eliminado.' });
        }

        if (userIdAuth !== parseInt(userIdToDelete)) {
            return res.status(403).json({ message: 'No tiene permiso para eliminar este usuario.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error en userController.eliminarUsuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario.' });
    }
}


exports.registrarUsuario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const token = userService.generarAutenticacionToken(nuevoUsuario);
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON(); // Excluir contraseña
        res.status(201).json({ ...usuarioSinContrasena, token });
    } catch (error) {
        console.error('Error en userController.registrarUsuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError' || (error.errors && error.errors[0].path === 'correo_electronico')) {
            return res.status(409).json({ message: error.message || 'El correo electrónico ya está en uso.' });
        }
        if (error.name === 'SequelizeValidationError' || (error.errors && error.errors.length > 0)) {
            return res.status(400).json({ message: error.message || 'Error de validación en los datos proporcionados.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    }
}

exports.iniciarSesionUsuario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { correo_electronico, contrasena } = req.body;
    try {
        const usuario = await userService.loginUsuario(correo_electronico, contrasena);
        const token = userService.generarAutenticacionToken(usuario);
        const userId = usuario.id;
        const { contrasena: _, ...usuarioSinContrasena } = usuario.toJSON();

        const objectivesCount = await Objetivo.count({
            where: {
                id_usuario: userId
            }
        });

        const hasObjectives = objectivesCount > 0;

        res.status(200).json({ usuario: usuarioSinContrasena, token, hasObjectives });
    } catch (error) {
        console.error('Error en userController.iniciarSesionUsuario:', error);
        if (error.message === 'Correo electrónico o contraseña incorrectos') {
            res.status(401).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
        }
    }
};

exports.cerrarSesionUsuario = async (req, res) => {
    try {
        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        console.error('Error en userController.cerrarSesionUsuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al cerrar sesión.' });
    }
};