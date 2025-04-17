const User = require('../models/user');
const bcrypt = require('bcrypt');

// Funcion para obtener todos los usuarios
exports.obtenerUsuarios = async () => {
    try {
        const usuarios = await User.findAll();
        return usuarios;
    } catch (error) {
        console.error('Error al obtener usuarios:', error); // Registra el error en la consola
        throw new Error('Error al obtener los usuarios: ' + error.message); // Lanza un error con mensaje descriptivo
    }
};

// Funcion para obtener un usuario por su id
exports.obtenerUsuarioPorId = async (id) => {
    try {
        const usuario = await User.findByPk(id);
        return usuario;
    } catch (error) {
        throw error;
    }
}

// Funcion para crear un nuevo usuario
exports.crearUsuario = async (usuarioData) => {

    const { nombre_usuario, correo_electronico, contrasena } = usuarioData;


    const existente = await User.findOne({ where: { correo_electronico } });
    if (existente) {
        throw new Error('El correo electrónico ya está en uso');
    }

    try {
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(usuarioData.contrasena, salt);
        usuarioData.contrasena = hashedPassword;

        const nuevoUsuario = await User.create(usuarioData);
        return nuevoUsuario;
    } catch (error) {
        throw error;
    }
}

// Funcion para actualizar un usuario
exports.actualizarUsuario = async (id, usuarioData) => {
    try {
        // Encriptar la contraseña si se proporciona
        if (usuarioData.contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuarioData.contrasena, salt);
            usuarioData.contrasena = hashedPassword;
        }

        const usuario = await User.findByPk(id);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await usuario.update(usuarioData);
        // Devolver el usuario actualizado
        return await User.findByPk(id);
    } catch (error) {
        throw error;
    }
}

// Funcion para eliminar un usuario
exports.eliminarUsuario = async (id) => {
    try {
        const usuario = await User.findByPk(id);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await usuario.destroy();
        return usuario;
    } catch (error) {
        throw error;
    }
}
