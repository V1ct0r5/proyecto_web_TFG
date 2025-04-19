const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

// Funcion para la generación del token
exports.generarAutenticacionToken = (usuario) => {
    const payload = {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        correo_electronico: usuario.correo_electronico
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Función para autenticar un usuario
exports.loginUsuario = async (correo_electronico, contrasena) => {
    try {
        const usuario = await User.findOne({ where: { correo_electronico } });
        if (!usuario) {
            throw new Error('Correo electrónico o contraseña incorrectos');
        }

        // Verificar la contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            throw new Error('Correo electrónico o contraseña incorrectos');
        }

        // Autenticacion exitosa, Generar token
        const token = exports.generarAutenticacionToken(usuario);
        return { usuario, token };
    } catch (error) {
        throw error;
    }
};

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

