const e = require('express');
const userService = require('../services/userService');
const { validationResult } = require('express-validator');

// Controlador para obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await userService.obtenerUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios', message: error.message });
    }
};

// Controlador para crear un nuevo usuario
exports.crearUsuario = async (req, res) => {
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        // Eliminar la contraseña del objeto de respuesta
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        res.status(201).json(usuarioSinContrasena);     
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error al crear el usuario' });
    }
}

// Controlador para obtener un usuario por su ID
exports.obtenerUsuarioPorId = async (req, res) => {
    const id = req.params.id;
    try {
        const usuario = await userService.obtenerUsuarioPorId(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
}

// Controlador para actualizar un usuario
exports.actualizarUsuario = async (req, res) => {
    const id = req.params.id;
    const usuarioData = req.body;
    try {
        const usuarioActualizado = await userService.actualizarUsuario(id, usuarioData);
        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
}

// Controlador para eliminar un usuario
exports.eliminarUsuario = async (req, res) => {
    const id = req.params.id;
    try {
        const usuarioEliminado = await userService.eliminarUsuario(id);
        if (!usuarioEliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
}

// Controlador para registrar un nuevo usuario
exports.registrarUsuario = async (req, res) => {
    const usuarioData = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const token = await nuevoUsuario.generarToken(); // Generar token para el nuevo usuario
        // Eliminar la contraseña del objeto de respuesta
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        res.status(201).json(usuarioSinContrasena);
    } catch (error) {
        if(error.message === 'El correo electrónico ya está en uso') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
}

// Controlador para iniciar sesión
exports.iniciarSesionUsuario = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const token = await userService.loginUsuario(correo_electronico, contrasena);
        if (token) {
            res.status(200).json({ token });
        } else {
            // Esto no debería alcanzarse si loginUsuario lanza un error
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(401).json({ message: error.message || 'Credenciales inválidas' });
    }
};