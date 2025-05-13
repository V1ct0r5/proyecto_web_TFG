// backend/src/api/controllers/userController.js
const userService = require('../services/userService');
const { validationResult } = require('express-validator');
const db = require('../../config/database'); // Necesario para iniciar/manejar transacciones en el futuro si no usas middleware

// Controlador para obtener todos los usuarios (Ruta protegida)
exports.obtenerUsuarios = async (req, res) => {
    // Asumiendo que el middleware de transacción (que crearemos después) adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: obtenerUsuarios - userId (auth):', req.user, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        const usuarios = await userService.obtenerUsuarios(transaction); // <--- Pasar transaction

        // El servicio ya excluye la contraseña, así que podemos devolver directamente
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error); // Log detallado del error interno
        res.status(500).json({ error: 'Error al obtener los usuarios', message: error.message }); // Mensaje más genérico para el cliente
    }
};

// NOTA: El controlador 'crearUsuario' parece un duplicado de la lógica de 'registrarUsuario'
// Si 'registrarUsuario' es el punto de entrada público para crear usuarios,
// este 'crearUsuario' podría eliminarse o usarse solo para lógica interna/admin sin ruta pública.
// Lo dejaremos tal cual por ahora, pero lo ideal sería unificar.
// Este controlador no necesita manejar transaction a menos que inicie una propia.
exports.crearUsuario = async (req, res) => {
    const usuarioData = req.body;
    try {
        const nuevoUsuario = await userService.crearUsuario(usuarioData);
        // Eliminar la contraseña del objeto de respuesta antes de enviar
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        res.status(201).json(usuarioSinContrasena);
    } catch (error) {
         // Manejo básico de errores, se puede mejorar para errores específicos
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


// Controlador para obtener un usuario por su ID (Ruta protegida, solo puede ver el propio perfil)
// Asumiendo que la ruta autenticada ya verifica que el ID del parámetro es el mismo que req.user
exports.obtenerUsuarioPorId = async (req, res) => {
    // Asumiendo que el middleware de autenticación adjunta req.user (ID del usuario autenticado)
    const userIdAuth = req.user;
    const userIdParam = req.params.id;

    // Asumiendo que la ruta ya tiene un middleware que verifica userIdAuth === userIdParam
    // Si no, esta verificación debe estar aquí. Por ahora, asumimos que llega aquí si está permitido.

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: obtenerUsuarioPorId - userId (auth):', userIdAuth, 'requestedId (param):', userIdParam, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        const usuario = await userService.obtenerUsuarioPorId(userIdParam, transaction); // <--- Pasar transaction

        if (!usuario) {
             // Esto solo debería ocurrir si el usuario fue eliminado justo después de la autenticación,
             // o si hay un problema con el ID o la transacción en un test.
             console.log('Controller: obtenerUsuarioPorId - Usuario no encontrado (404)'); // Log
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // El servicio ya excluye la contraseña, así que podemos devolver directamente
        // console.log('Controller: obtenerUsuarioPorId - Usuario encontrado, enviando 200'); // Log
        res.status(200).json(usuario);

    } catch (error) {
        console.error('Error al obtener el usuario por ID:', error); // Log detallado del error interno
        res.status(500).json({ error: 'Error al obtener el usuario' }); // Mensaje más genérico para el cliente
    }
}


// Controlador para actualizar un usuario (Ruta protegida, solo puede actualizar el propio perfil)
// Asumiendo que la ruta autenticada ya verifica que el ID del parámetro es el mismo que req.user
exports.actualizarUsuario = async (req, res) => {
     // Asumiendo que el middleware de autenticación adjunta req.user
     const userIdAuth = req.user;
    const userIdToUpdate = req.params.id;
    const usuarioData = req.body;

     // Asumiendo que la ruta ya tiene un middleware que verifica userIdAuth === userIdToUpdate
     // Si no, esta verificación debe estar aquí.

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: actualizarUsuario - userId (auth):', userIdAuth, 'userIdToUpdate (param):', userIdToUpdate, 'data:', usuarioData, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        const usuarioActualizado = await userService.actualizarUsuario(userIdToUpdate, usuarioData, transaction); // <--- Pasar transaction

        if (!usuarioActualizado) {
             // Esto solo debería ocurrir si el usuario fue eliminado justo antes de actualizar,
             // o si hay un problema con el ID o la transacción en un test.
             console.log('Controller: actualizarUsuario - Usuario no encontrado (404)'); // Log
            return res.status(404).json({ error: 'Usuario no encontrado o no pudo ser actualizado' });
        }

        // El servicio devuelve la instancia actualizada sin contraseña, podemos devolver directamente
        // console.log('Controller: actualizarUsuario - Usuario actualizado, enviando 200'); // Log
        res.status(200).json(usuarioActualizado);

    } catch (error) {
        console.error('Error al actualizar el usuario:', error); // Log detallado del error interno
         // Manejo de errores específicos
         if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ error: error.errors[0].message || 'El correo electrónico ya está en uso' });
         }
         if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ error: error.errors[0].message || 'Error de validación' });
         }
        res.status(500).json({ error: 'Error al actualizar el usuario', message: error.message }); // Mensaje genérico para otros errores
    }
}

// Controlador para eliminar un usuario (Ruta protegida, solo puede eliminar el propio perfil)
// Asumiendo que la ruta autenticada ya verifica que el ID del parámetro es el mismo que req.user
exports.eliminarUsuario = async (req, res) => {
     // Asumiendo que el middleware de autenticación adjunta req.user
     const userIdAuth = req.user;
    const userIdToDelete = req.params.id;

     // Asumiendo que la ruta ya tiene un middleware que verifica userIdAuth === userIdToDelete
     // Si no, esta verificación debe estar aquí.

    // Asumiendo que el middleware de transacción adjunta la transacción a req
    const transaction = req.transaction; // <--- Obtener la transacción del request

    // console.log('Controller: eliminarUsuario - userId (auth):', userIdAuth, 'userIdToDelete (param):', userIdToDelete, 'transaction:', transaction ? 'Yes' : 'No'); // Log de depuración

    try {
        // Pasa la transacción al servicio
        // El servicio ahora devuelve el número de filas eliminadas (0 o 1)
        const deletedCount = await userService.eliminarUsuario(userIdToDelete, transaction); // <--- Pasar transaction

        // console.log('Controller: eliminarUsuario - Resultado del servicio (deletedCount):', deletedCount); // Log de depuración

        if (deletedCount === 0) {
             // Si el count es 0, significa que el usuario no fue encontrado (o no pertenece al usuario auth, si el servicio lo verificara)
             console.log('Controller: eliminarUsuario - Usuario no encontrado (404)'); // Log
            return res.status(404).json({ error: 'Usuario no encontrado o no pudo ser eliminado' });
        }

        // Si deletedCount es > 0 (esperamos 1), fue exitoso
        // console.log('Controller: eliminarUsuario - Usuario eliminado, enviando 204'); // Log
        res.status(204).send(); // 204 No Content es la respuesta estándar para DELETE exitoso sin cuerpo

    } catch (error) {
        console.error('Error al eliminar el usuario:', error); // Log detallado del error interno
        res.status(500).json({ error: 'Error al eliminar el usuario', message: error.message }); // Mensaje más genérico para el cliente
    }
}


// Controlador para registrar un nuevo usuario (Ruta pública)
exports.registrarUsuario = async (req, res) => {
    // La validación con express-validator ya se hizo antes de llegar aquí
    const usuarioData = req.body;

    // console.log('Controller: registrarUsuario - Datos recibidos:', usuarioData); // Log de depuración

    try {
        // No pasamos transaction aquí, ya que esta ruta no inicia una transacción por sí sola típicamente.
        // Si la creación necesitara ser transaccional (ej: crear usuario + datos relacionados),
        // la transacción debería iniciarse AQUÍ o en un middleware específico para esta ruta.
        const nuevoUsuario = await userService.crearUsuario(usuarioData); // <--- No pasar transaction aquí (ruta pública)

        // console.log('Controller: registrarUsuario - Resultado del servicio crearUsuario:', nuevoUsuario ? `Usuario creado con ID ${nuevoUsuario.id}` : 'null'); // Log de depuración


        // Generar token para el nuevo usuario
        const token = userService.generarAutenticacionToken(nuevoUsuario); // El servicio genera el token

        // console.log('Controller: registrarUsuario - Token generado:', token ? 'Sí' : 'No'); // Log de depuración

        // Eliminar la contraseña del objeto de respuesta
        const { contrasena, ...usuarioSinContrasena } = nuevoUsuario.toJSON();
        // console.log('Controller: registrarUsuario - Usuario sin contraseña para response:', usuarioSinContrasena); // Log de depuración

        // Incluir el token en la respuesta 201
        // console.log('Controller: registrarUsuario - Enviando respuesta 201 con usuario y token'); // Log de depuración
        res.status(201).json({...usuarioSinContrasena, token});

    } catch (error) {
        console.error('Error al registrar el usuario:', error); // Log detallado del error interno

        // Manejo de errores específicos lanzados por el servicio
        if(error.name === 'SequelizeUniqueConstraintError' || (error.errors && error.errors[0].path === 'correo_electronico')) {
            return res.status(409).json({ error: error.message || 'El correo electrónico ya está en uso' });
        }
         if(error.name === 'SequelizeValidationError' || (error.errors && error.errors.length > 0)) {
             return res.status(400).json({ error: error.message || 'Error de validación en los datos proporcionados' });
         }
        // Otros errores inesperados
        res.status(500).json({ message: 'Error interno al registrar el usuario' }); // Mensaje genérico
    }
}

// Controlador para iniciar sesión (Ruta pública)
exports.iniciarSesionUsuario = async (req, res) => {
     // La validación con express-validator ya se hizo
    const { correo_electronico, contrasena } = req.body;

    // console.log('Controller: iniciarSesionUsuario - Intentando iniciar sesión para:', correo_electronico); // Log de depuración

    try {
        // El servicio loginUsuario ahora devuelve solo la instancia del usuario encontrado
        const usuario = await userService.loginUsuario(correo_electronico, contrasena); // <--- No pasar transaction aquí (ruta pública)

        // console.log('Controller: iniciarSesionUsuario - Servicio loginUsuario devolvió usuario:', usuario ? `Usuario ID ${usuario.id}` : 'null'); // Log de depuración

        // Generar el token DENTRO del controlador, después de verificar las credenciales
        const token = userService.generarAutenticacionToken(usuario);
         // console.log('Controller: iniciarSesionUsuario - Token generado después de login exitoso.'); // Log de depuración


        // Eliminar la contraseña del objeto de respuesta si es necesario
        const { contrasena: _, ...usuarioSinContrasena } = usuario.toJSON();

        // console.log('Controller: iniciarSesionUsuario - Enviando respuesta 200 con usuario y token.'); // Log de depuración
        res.status(200).json({ usuario: usuarioSinContrasena, token }); // Devuelve usuario sin contraseña y token

    } catch (error) {
        console.error('Error al iniciar sesión:', error); // Log detallado del error interno

        // El servicio loginUsuario lanza un error genérico "Correo electrónico o contraseña incorrectos"
        // para ambos casos (usuario no encontrado o contraseña incorrecta) por seguridad.
        // El controlador captura este error y devuelve 401.
        if (error.message === 'Correo electrónico o contraseña incorrectos') {
             // console.log('Controller: iniciarSesionUsuario - Credenciales inválidas (401).'); // Log de depuración
            res.status(401).json({ message: error.message });
        } else {
            // Otros errores inesperados del servicio
             console.error('Controller: iniciarSesionUsuario - Error inesperado durante login:', error); // Log de depuración
            res.status(500).json({ message: 'Error interno al iniciar sesión' });
        }
    }
};

exports.cerrarSesionUsuario = async (req, res) => {
    try {
        // Simplemente confirmamos que la acción fue recibida con un 200 OK
        res.status(200).json({ message: 'Sesión cerrada exitosamente (en el frontend)' });

    } catch (error) {
        console.error('Error en controlador logout:', error);
        // Aunque no haya mucho que falle en este caso, es buena práctica manejar posibles errores (ej. lista negra)
        res.status(500).json({ error: 'Error al intentar cerrar sesión en el servidor' });
    }
};