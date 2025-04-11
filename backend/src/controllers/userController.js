const e = require('express');
const userService = require('../services/userService');

// Controlador para obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await userService.obtenerUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
}

// Controlador para crear un nuevo usuario
exports.crearUsuario = async (req, res) => {
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el usuario' });
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

