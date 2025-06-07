// backend/src/api/controllers/userController.js
const userService = require('../services/userService');
const objectivesService = require('../services/objectivesService'); // Para verificar si el usuario tiene objetivos
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError'); // Para un manejo de errores consistente

exports.obtenerUsuarios = async (req, res, next) => {
    try {
        const usuarios = await userService.obtenerUsuarios();
        // Asegurar que las contraseñas no se envíen en la lista
        const usuariosSinContrasena = usuarios.map(u => {
            const { contrasena, ...resto } = u.toJSON ? u.toJSON() : { ...u };
            return resto;
        });
        res.status(200).json(usuariosSinContrasena);
    } catch (error) {
        next(error); // Delegar al errorHandler global
    }
};

// Registra un nuevo usuario y devuelve el usuario y un token.
exports.registrarUsuario = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Considerar usar next(new AppError('Errores de validación', 400, errors.array())) para consistencia
        return res.status(400).json({ errors: errors.array() });
    }
    
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const token = userService.generarTokenAutenticacion(nuevoUsuario);
        
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON ? nuevoUsuario.toJSON() : { ...nuevoUsuario };
        res.status(201).json({ 
            message: "Usuario registrado con éxito.",
            token,
            ...usuarioSinContrasena
        });
    } catch (error) {
        next(error); // Errores (ej. 409 por duplicado) son manejados por el servicio y pasados al errorHandler
    }
};

// Crea un usuario (potencialmente por un admin, no devuelve token como registrarUsuario).
// NOTA: El nombre 'crearUsuario' está duplicado. Esto funcionará si se usan en diferentes rutas
// o si el router importa específicamente una u otra con un alias.
// Por claridad, sería mejor nombres de exportación únicos si las funcionalidades difieren.
exports.crearUsuario = async (req, res, next) => { // Función duplicada, ver nota
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON ? nuevoUsuario.toJSON() : { ...nuevoUsuario };
        res.status(201).json(usuarioSinContrasena);
    } catch (error) {
        next(error);
    }
};

// Obtiene un usuario por ID (protegido para que solo el propio usuario pueda acceder).
exports.obtenerUsuarioPorId = async (req, res, next) => {
    const userIdAuth = req.user.id; 
    const userIdParam = req.params.id;

    try {
        if (String(userIdAuth) !== String(userIdParam)) {
            return next(new AppError('Acceso denegado. No puedes obtener información de otros usuarios.', 403));
        }
        const usuario = await userService.obtenerUsuarioPorId(userIdParam);
        // El servicio ya lanza AppError 404 si no se encuentra
        const { contrasena, ...usuarioSinContrasena } = usuario.toJSON ? usuario.toJSON() : { ...usuario };
        res.status(200).json(usuarioSinContrasena);
    } catch (error) {
        next(error);
    }
};

// Actualiza un usuario (protegido para que solo el propio usuario pueda actualizarse).
exports.actualizarUsuario = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userIdAuth = req.user.id;
    const userIdToUpdate = req.params.id;
    const usuarioData = req.body;

    try {
        if (String(userIdAuth) !== String(userIdToUpdate)) {
            return next(new AppError('Acceso denegado. No puedes actualizar la información de otros usuarios.', 403));
        }
        const usuarioActualizado = await userService.actualizarUsuario(userIdToUpdate, usuarioData);
        // El servicio maneja errores 404 y 409.
        const { contrasena, ...usuarioSinContrasena } = usuarioActualizado.toJSON ? usuarioActualizado.toJSON() : { ...usuarioActualizado };
        res.status(200).json({
            message: "Usuario actualizado con éxito.",
            usuario: usuarioSinContrasena
        });
    } catch (error) {
        next(error);
    }
};

// Elimina un usuario (protegido para que solo el propio usuario pueda eliminarse).
exports.eliminarUsuario = async (req, res, next) => {
    const userIdAuth = req.user.id;
    const userIdToDelete = req.params.id;

    try {
        if (String(userIdAuth) !== String(userIdToDelete)) {
            return next(new AppError('Acceso denegado. No puedes eliminar a otros usuarios.', 403));
        }
        await userService.eliminarUsuario(userIdToDelete);
        // El servicio maneja el error 404.
        res.status(204).send(); // No Content
    } catch (error) {
        next(error);
    }
};

// Inicia sesión de un usuario.
exports.iniciarSesionUsuario = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { correo_electronico, contrasena } = req.body;
    try {
        const { token, usuario } = await userService.loginUsuario(correo_electronico, contrasena);
        // userService.loginUsuario lanza AppError 401 si las credenciales son incorrectas.
        
        const tieneObjetivos = await objectivesService.usuarioTieneObjetivos(usuario.id);
        const { contrasena: _, ...usuarioSinContrasena } = usuario.toJSON ? usuario.toJSON() : { ...usuario };

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            usuario: usuarioSinContrasena,
            token,
            hasObjectives: tieneObjetivos
        });
    } catch (error) {
        next(error); // El servicio o errorHandler global manejan los detalles.
    }
};

// Cierra la sesión de un usuario (principalmente una operación del lado del cliente para JWT).
exports.cerrarSesionUsuario = async (req, res, next) => {
    try {
        // Lógica de invalidación de token en servidor (blacklist) podría ir aquí si se implementa.
        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        next(error);
    }
};