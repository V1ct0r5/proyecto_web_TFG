const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.obtenerUsuarios = async (transaction = null) => {
    try {
        const usuarios = await db.User.findAll({
            attributes: { exclude: ['contrasena'] },
        }, { transaction });
        return usuarios;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw new Error('Error al obtener los usuarios: ' + error.message);
    }
};

exports.obtenerUsuarioPorId = async (id, transaction = null) => {
    try {
        const usuario = await db.User.findByPk(id, {
            attributes: { exclude: ['contrasena'] },
        }, { transaction });
        return usuario;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        throw new Error('Error al obtener el usuario por ID: ' + error.message);
    }
}

exports.crearUsuario = async (usuarioData, transaction = null) => {

    const { nombre_usuario, correo_electronico, contrasena } = usuarioData;
    if (!nombre_usuario || !correo_electronico || !contrasena) {
        const validationError = new Error('Error de validación: Faltan campos obligatorios');
        validationError.name = 'SequelizeValidationError';
        validationError.errors = [{ message: 'Faltan campos obligatorios' }];
        throw validationError;
    }

    try {
        const existente = await db.User.findOne({ where: { correo_electronico } }, { transaction });
        if (existente) {
            const uniqueError = new Error('El correo electrónico ya está en uso');
            uniqueError.name = 'SequelizeUniqueConstraintError';
            uniqueError.errors = [{ message: 'El correo electrónico ya está en uso', path: 'correo_electronico' }];
            throw uniqueError;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const nuevoUsuarioData = {
            nombre_usuario,
            correo_electronico,
            contrasena: hashedPassword,
            fecha_registro: new Date(),
        };

        const nuevoUsuario = await db.User.create(nuevoUsuarioData, { transaction });

        return nuevoUsuario;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
            throw error;
        }
        throw new Error('Error al crear el usuario: ' + error.message);
    }
}

exports.actualizarUsuario = async (id, usuarioData, transaction = null) => {
    try {
        if (usuarioData.contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuarioData.contrasena, salt);
            usuarioData.contrasena = hashedPassword;
        } else {
            delete usuarioData.contrasena;
        }


        const usuario = await db.User.findByPk(id, { transaction });


        if (!usuario) {
            return null;
        }

        const usuarioActualizado = await usuario.update(usuarioData, { transaction });


        return usuarioActualizado;

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
            throw error;
        }
        throw new Error('Error al actualizar el usuario: ' + error.message);
    }
}

exports.generarAutenticacionToken = (usuario) => {
    const payload = {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        correo_electronico: usuario.correo_electronico
    };
    const secret = process.env.JWT_SECRET || 'tu_clave_secreta_muy_larga_y_segura';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    return token;
}

exports.loginUsuario = async (correo_electronico, contrasena) => {
    try {
        const usuario = await db.User.findOne({ where: { correo_electronico } });

        if (!usuario) {
            const authError = new Error('Correo electrónico o contraseña incorrectos');
            authError.status = 401;
            throw authError;
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            const authError = new Error('Correo electrónico o contraseña incorrectos');
            authError.status = 401;
            throw authError;
        }

        return usuario;

    } catch (error) {
        console.error('Error en loginUsuario:', error);
        throw error;
    }
};

exports.eliminarUsuario = async (id, transaction = null) => {
    try {
        const deletedCount = await db.User.destroy({
            where: { id: id },
        }, { transaction });

        if (deletedCount === 0) {
            return 0;
        }

        return deletedCount;

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw new Error('Error al eliminar el usuario: ' + error.message);
    }
}

exports.verificarAutenticacionToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'tu_clave_secreta_muy_larga_y_segura';
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error('Service: verificarAutenticacionToken - Error verificando token:', error.message);
        if (error.name === 'TokenExpiredError') {
            const expiredError = new Error('Token expirado');
                expiredError.status = 401;
                throw expiredError;
        }
            if (error.name === 'JsonWebTokenError') {
                const invalidError = new Error('Token inválido');
                invalidError.status = 403;
                throw invalidError;
            }
        const verifyError = new Error('Error verificando token');
            verifyError.status = 500;
            throw verifyError;
    }
};