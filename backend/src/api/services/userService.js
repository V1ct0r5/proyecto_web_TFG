// backend/src/api/services/userService.js
const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Funcion para obtener todos los usuarios
// Acepta transaction y la pasa a findAll
exports.obtenerUsuarios = async (transaction = null) => {
    // console.log('Service: obtenerUsuarios - transaction:', transaction ? 'Yes' : 'No'); // Log de depuración, puedes quitarlo después
    try {
        // Añadir la exclusión de contraseña si quieres que el servicio se encargue de esto
        // O quitarla y dejar que el controlador maneje el toJSON y la exclusión
        // Mantendremos la exclusión aquí por ahora, basándonos en tu código anterior
        const usuarios = await db.User.findAll({
             attributes: { exclude: ['contrasena'] }, // Excluye la contraseña
        }, { transaction }); // <--- Pasa la transacción
        // console.log('Service: obtenerUsuarios - Resultado:', usuarios ? `${usuarios.length} usuarios encontrados` : 'null'); // Log de depuración
        return usuarios;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw new Error('Error al obtener los usuarios: ' + error.message);
    }
};

// Funcion para obtener un usuario por su id
// Acepta transaction y la pasa a findByPk
exports.obtenerUsuarioPorId = async (id, transaction = null) => {
    // console.log('Service: obtenerUsuarioPorId - id:', id, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Añadir la exclusión de contraseña si quieres que el servicio se encargue de esto
        const usuario = await db.User.findByPk(id, {
             attributes: { exclude: ['contrasena'] }, // Excluye la contraseña
        }, { transaction }); // <--- Pasa la transacción
        // console.log('Service: obtenerUsuarioPorId - Resultado:', usuario ? `Usuario ID ${usuario.id} encontrado` : 'null'); // Log de depuración
        return usuario;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        throw new Error('Error al obtener el usuario por ID: ' + error.message);
    }
}

// Funcion para crear un nuevo usuario
// Acepta transaction y la pasa a findOne y create
exports.crearUsuario = async (usuarioData, transaction = null) => {
    // console.log('Service: crearUsuario - usuarioData:', usuarioData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    // Validaciones básicas de campos obligatorios (redundantes si usas express-validator, pero no hacen daño)
    const { nombre_usuario, correo_electronico, contrasena } = usuarioData;
    if (!nombre_usuario || !correo_electronico || !contrasena) {
        const validationError = new Error('Error de validación: Faltan campos obligatorios');
        validationError.name = 'SequelizeValidationError'; // Usar un nombre de error conocido si el controlador lo espera
        validationError.errors = [{ message: 'Faltan campos obligatorios' }];
        throw validationError;
    }

    try {
        // Verificar si el correo electrónico ya está en uso, USANDO la transacción si se proporciona
        const existente = await db.User.findOne({ where: { correo_electronico } }, { transaction }); // <--- Pasa la transacción
        if (existente) {
            const uniqueError = new Error('El correo electrónico ya está en uso');
            uniqueError.name = 'SequelizeUniqueConstraintError'; // Usar un nombre de error conocido
             uniqueError.errors = [{ message: 'El correo electrónico ya está en uso', path: 'correo_electronico' }]; // Detalles del error
            throw uniqueError;
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const nuevoUsuarioData = {
            nombre_usuario,
            correo_electronico,
            contrasena: hashedPassword,
            // Asegúrate de añadir otros campos si son obligatorios en el modelo (ej: fecha_registro)
             fecha_registro: new Date(), // Ejemplo si tu modelo lo tiene
        };

        // Crear usuario, pasando la transacción
        const nuevoUsuario = await db.User.create(nuevoUsuarioData, { transaction }); // <--- Pasa la transacción

        // console.log('Service: crearUsuario - Resultado:', nuevoUsuario ? `Usuario ID ${nuevoUsuario.id} creado` : 'null'); // Log de depuración
        return nuevoUsuario; // Devuelve la instancia completa (el controlador debería quitar la contraseña para la respuesta)
    } catch (error) {
        console.error('Error al crear usuario:', error);
         // Relanza errores específicos si es necesario para que el controlador los maneje (ej: SequelizeValidationError, SequelizeUniqueConstraintError)
         if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
             throw error; // Lanza el error original con su nombre y detalles
         }
        // Para otros errores inesperados, lanza un error genérico pero con el mensaje original
        throw new Error('Error al crear el usuario: ' + error.message);
    }
}

// Funcion para actualizar un usuario
// Acepta transaction y la pasa a findByPk y update
exports.actualizarUsuario = async (id, usuarioData, transaction = null) => {
    // console.log('Service: actualizarUsuario - id:', id, 'data:', usuarioData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Encriptar la contraseña si se proporciona
        if (usuarioData.contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuarioData.contrasena, salt);
            usuarioData.contrasena = hashedPassword;
             // console.log('Service: actualizarUsuario - Contraseña hasheada.'); // Log de depuración
        } else {
            // Asegurarse de no intentar actualizar la contraseña si no se proporcionó (si el objeto usuarioData tiene la propiedad pero es undefined o null)
            delete usuarioData.contrasena;
        }


        // Buscar usuario, pasando la transacción
        const usuario = await db.User.findByPk(id, { transaction }); // <--- Pasa la transacción

        // console.log('Service: actualizarUsuario - Resultado findByPk (para update):', usuario ? `Usuario ID ${usuario.id} encontrado` : 'null'); // Log de depuración

        if (!usuario) {
            // console.log('Service: actualizarUsuario - Usuario no encontrado.'); // Log de depuración
            return null; // Devolver null si no se encuentra el usuario
        }

        // Actualizar el usuario, pasando la transacción al método de instancia
        // El método update en una instancia devuelve la instancia actualizada
        const usuarioActualizado = await usuario.update(usuarioData, { transaction }); // <--- Pasa la transacción

        // console.log('Service: actualizarUsuario - Resultado update:', usuarioActualizado ? `Usuario ID ${usuarioActualizado.id} actualizado` : 'null'); // Log de depuración

        // Devuelve la instancia actualizada (el controlador manejará la exclusión de la contraseña)
        return usuarioActualizado;

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
         // Relanza errores específicos si es necesario (ej: SequelizeValidationError, SequelizeUniqueConstraintError)
         if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
             throw error; // Lanza el error original
         }
        throw new Error('Error al actualizar el usuario: ' + error.message);
    }
}

// Funcion para la generación del token (No interactúa con DB, no necesita transaction)
exports.generarAutenticacionToken = (usuario) => {
    // console.log('Service: generarAutenticacionToken - Generando token para usuario ID:', usuario.id); // Log de depuración
    const payload = {
        id: usuario.id, // Usar el ID del usuario
        nombre_usuario: usuario.nombre_usuario,
        correo_electronico: usuario.correo_electronico
        // Incluir otros datos relevantes si es necesario
    };
    // Asegúrate de que process.env.JWT_SECRET está cargado (desde .env)
    const secret = process.env.JWT_SECRET || 'tu_clave_secreta_muy_larga_y_segura'; // Usar una clave robusta, idealmente de .env
    // console.log('Service: generarAutenticacionToken - JWT Secret:', secret ? 'Loaded' : 'Missing'); // Log de depuración
    const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Configura el tiempo de expiración
    // console.log('Service: generarAutenticacionToken - Token generado.'); // Log de depuración
    return token;
}

// Función para autenticar un usuario (login) - No necesita transaction de test típicamente
exports.loginUsuario = async (correo_electronico, contrasena) => {
    // console.log('Service: loginUsuario - correo:', correo_electronico); // Log de depuración
    try {
        // Buscar el usuario (generalmente no necesita transaction aquí a menos que sea parte de una operación mayor)
        const usuario = await db.User.findOne({ where: { correo_electronico } });

        if (!usuario) {
            // console.log('Service: loginUsuario - Usuario no encontrado para login.'); // Log de depuración
             // Lanza el mismo error para usuario no encontrado y contraseña inválida por seguridad
            const authError = new Error('Correo electrónico o contraseña incorrectos');
             authError.status = 401; // Sugerir un status code (opcional, el controlador es quien lo fija)
             throw authError;
        }

        // Verificar la contraseña hasheada
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            // console.log('Service: loginUsuario - Contraseña inválida.'); // Log de depuración
             // Lanza el mismo error por seguridad
             const authError = new Error('Correo electrónico o contraseña incorrectos');
             authError.status = 401; // Sugerir un status code
            throw authError;
        }

        // Autenticacion exitosa, Devuelve la instancia del usuario encontrado
        // El controlador generará el token y quitará la contraseña
        // console.log('Service: loginUsuario - Login exitoso, devolviendo usuario.'); // Log de depuración
        return usuario;

    } catch (error) {
        console.error('Error en loginUsuario:', error);
        // Relanza el error, incluyendo el status sugerido si existe
        throw error;
    }
};

// Funcion para eliminar un usuario
// Acepta transaction y la pasa a destroy
exports.eliminarUsuario = async (id, transaction = null) => {
    // console.log('Service: eliminarUsuario - id:', id, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración
    try {
        // Eliminar usuario, pasando la transacción
        // Sequelize destroy devuelve el número de filas afectadas
        const deletedCount = await db.User.destroy({
            where: { id: id },
        }, { transaction }); // <--- Pasa la transacción

        // console.log('Service: eliminarUsuario - Resultado del destroy (filas afectadas):', deletedCount); // Log de depuración

        if (deletedCount === 0) {
             // console.log('Service: eliminarUsuario - No se encontró el usuario para eliminar.'); // Log de depuración
            return 0; // Devolver 0 para indicar que no se encontró/eliminó
        }

        // console.log('Service: eliminarUsuario - Usuario eliminado exitosamente (filas afectadas: 1).'); // Log de depuración
        return deletedCount; // Retornar 1 si se eliminó exitosamente

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw new Error('Error al eliminar el usuario: ' + error.message);
    }
}

// Función para verificar token JWT (No interactúa con DB, no necesita transaction)
// Esta función podría ir en authMiddleware, pero también puede vivir en el servicio si lo prefieres.
// Si está aquí, el middleware de auth la llamaría.
exports.verificarAutenticacionToken = (token) => {
    // console.log('Service: verificarAutenticacionToken - Verificando token...'); // Log de depuración
    try {
        const secret = process.env.JWT_SECRET || 'tu_clave_secreta_muy_larga_y_segura'; // Usa la misma clave que al generar
        const decoded = jwt.verify(token, secret);
        // console.log('Service: verificarAutenticacionToken - Token verificado exitosamente. Payload:', decoded); // Log de depuración
        return decoded; // Devuelve el payload decodificado (que incluye el ID del usuario)
    } catch (error) {
        console.error('Service: verificarAutenticacionToken - Error verificando token:', error.message);
        // Relanza errores específicos de JWT para que el middleware los maneje
        if (error.name === 'TokenExpiredError') {
            const expiredError = new Error('Token expirado');
                expiredError.status = 401;
                throw expiredError;
        }
            if (error.name === 'JsonWebTokenError') {
                const invalidError = new Error('Token inválido');
                invalidError.status = 403; // O 401 dependiendo de la política
                throw invalidError;
            }
        // Para otros errores inesperados durante la verificación
        const verifyError = new Error('Error verificando token');
            verifyError.status = 500;
            throw verifyError;
    }
};