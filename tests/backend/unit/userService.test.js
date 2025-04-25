// tests/unit/usersService.test.js
const userService = require('../../../backend/src/api/services/userService');
const User = require('../../../backend/src/api/models/user');
const bcrypt = require('bcrypt');
const e = require('express');

jest.mock('../../../backend/src/api/models/user');
jest.mock('bcrypt');

describe('UserService', () => {
    const salt = 'salt';
    const hashedPassword = 'hashedPassword';

    const usuarioDataValido = {
        nombre_usuario: 'Test User',
        correo_electronico: 'test@example.com',
        contrasena: 'password123',
    };

    const usuarioExistente = {
        id: 1,
        ...usuarioDataValido,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crearUsuario', () => {
        it('debería crear un nuevo usuario con datos válidos', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            User.create.mockResolvedValue(usuarioExistente);

            const resultado = await userService.crearUsuario(usuarioDataValido);

            expect(User.findOne).toHaveBeenCalledWith({ where: { correo_electronico: usuarioDataValido.correo_electronico } });
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(usuarioDataValido.contrasena, salt);
            expect(User.create).toHaveBeenCalledWith({ ...usuarioDataValido, contrasena: hashedPassword });
            expect(resultado).toEqual(usuarioExistente);
        });

        it('debería lanzar un error si la generación de salt falla', async () => {
            bcrypt.genSalt.mockRejectedValue(new Error('Error al generar salt'));

            await expect(userService.crearUsuario(usuarioDataValido)).rejects.toThrow('Error al generar salt');
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(User.create).not.toHaveBeenCalled();
        });

        it('debería lanzar un error si los datos están incompletos', async () => {
            await expect(userService.crearUsuario({ nombre_usuario: 'SoloNombre' })).rejects.toThrow('Datos incompletos');
            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(User.create).not.toHaveBeenCalled();
        });

        it('debería lanzar un error si el correo electrónico ya está en uso', async () => {
            User.findOne.mockResolvedValue(usuarioExistente);

            await expect(userService.crearUsuario(usuarioDataValido)).rejects.toThrow('El correo electrónico ya está en uso');
            expect(User.findOne).toHaveBeenCalledWith({ where: { correo_electronico: usuarioDataValido.correo_electronico } });
            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(User.create).not.toHaveBeenCalled();
        });

        it('debería manejar errores al crear el usuario en la base de datos', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            User.create.mockRejectedValue(new Error('Error de base de datos'));

            await expect(userService.crearUsuario(usuarioDataValido)).rejects.toThrow('Error de base de datos');
            expect(User.findOne).toHaveBeenCalledWith({ where: { correo_electronico: usuarioDataValido.correo_electronico } });
            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalled();
            expect(User.create).toHaveBeenCalledWith({ ...usuarioDataValido, contrasena: hashedPassword });
        });
    });

    describe('obtenerUsuarios', () => {
        it('debería devolver una lista de usuarios', async () => {
            const mockUsuarios = [usuarioExistente, { id: 2, nombre_usuario: 'Otro Usuario' }];
            User.findAll.mockResolvedValue(mockUsuarios);
            const resultado = await userService.obtenerUsuarios();
            expect(User.findAll).toHaveBeenCalledTimes(1);
            expect(resultado).toEqual(mockUsuarios);
        });

        it('debería lanzar un error si falla la obtención de usuarios', async () => {
            User.findAll.mockRejectedValue(new Error('Error al obtener usuarios'));
            await expect(userService.obtenerUsuarios()).rejects.toThrow('Error al obtener los usuarios: Error al obtener usuarios');
        });
    });

    describe('obtenerUsuarioPorId', () => {
        it('debería devolver un usuario válido por su ID', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            const resultado = await userService.obtenerUsuarioPorId(usuarioExistente.id);
            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(resultado).toEqual(usuarioExistente);
        });

        it('debería devolver null si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);
            const resultado = await userService.obtenerUsuarioPorId(999);
            expect(User.findByPk).toHaveBeenCalledWith(999);
            expect(resultado).toBeNull();
        });

        it('debería lanzar un error si falla la búsqueda del usuario', async () => {
            User.findByPk.mockRejectedValue(new Error('Error al buscar usuario'));
            await expect(userService.obtenerUsuarioPorId(usuarioExistente.id)).rejects.toThrow('Error al buscar usuario');
        });
    });

    describe('actualizarUsuario', () => {
        it('debería actualizar un usuario existente con datos válidos', async () => {
            const idUsuario = usuarioExistente.id;
            const datosActualizados = { nombre_usuario: 'Nuevo Nombre' };
            const usuarioActualizado = { ...usuarioExistente, ...datosActualizados };

            const mockUsuarioInstance = { // Simula una instancia de modelo
                ...usuarioExistente,
                update: jest.fn().mockResolvedValue(usuarioActualizado), // Simula el método update
            };

            User.findByPk.mockResolvedValueOnce(mockUsuarioInstance); 
            User.findByPk.mockResolvedValueOnce(usuarioActualizado); 
        
            const resultado = await userService.actualizarUsuario(idUsuario, datosActualizados);
        
            // Verifica las llamadas a los métodos
            expect(User.findByPk).toHaveBeenNthCalledWith(1, idUsuario); // Primera llamada
            expect(mockUsuarioInstance.update).toHaveBeenCalledWith(datosActualizados);
            expect(User.findByPk).toHaveBeenNthCalledWith(2, idUsuario); // Segunda llamada
            expect(resultado).toEqual(usuarioActualizado);
        });

        it('debería actualizar la contraseña si se proporciona', async () => {
            const idUsuario = usuarioExistente.id;
            const nuevaContrasena = 'newPassword1234';
            const datosActualizados = { contrasena: nuevaContrasena };
            const nuevoHashedPassword = 'newHashedPassword';
            const salt = 'mockedSalt';
            const usuarioActualizado = { ...usuarioExistente, contrasena: nuevoHashedPassword };
            const mockUpdateResult = [1];
    
            const mockUsuarioInstance = {
                ...usuarioExistente,
                update: jest.fn().mockResolvedValue(usuarioActualizado),
            };
            
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(nuevoHashedPassword);


            User.findByPk.mockResolvedValueOnce(mockUsuarioInstance);
            User.findByPk.mockResolvedValueOnce(usuarioActualizado);
    
            const resultado = await userService.actualizarUsuario(idUsuario, datosActualizados);
    
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(nuevaContrasena, salt);
            expect(User.findByPk).toHaveBeenNthCalledWith(1, idUsuario);
            expect(mockUsuarioInstance.update).toHaveBeenCalledWith({ contrasena: nuevoHashedPassword });
            expect(User.findByPk).toHaveBeenNthCalledWith(2, idUsuario);
            expect(resultado).toEqual(usuarioActualizado);
        });
    
        it('debería devolver null si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);
            const resultado = await userService.actualizarUsuario(999, { nombre_usuario: 'Nuevo' });
            expect(resultado).toBeNull();
            expect(User.update).not.toHaveBeenCalled();
        });
    
        it('no debería hashear la contraseña si no se proporciona', async () => {
            const idUsuario = usuarioExistente.id;
            const datosActualizados = { nombre_usuario: 'Nuevo Nombre' };
            User.findByPk.mockResolvedValue({ ...usuarioExistente,  ...datosActualizados });
    
            const mockUsuarioInstance = {
                ...usuarioExistente,
                update: jest.fn().mockResolvedValue(undefined),
            };

            User.findByPk.mockResolvedValueOnce(mockUsuarioInstance);
            User.findByPk.mockResolvedValueOnce(usuarioExistente);

            await userService.actualizarUsuario(idUsuario, datosActualizados);

            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(User.findByPk).toHaveBeenNthCalledWith(1, idUsuario);
            expect(mockUsuarioInstance.update).toHaveBeenCalledWith(datosActualizados);
            expect(User.findByPk).toHaveBeenNthCalledWith(2, idUsuario);
        });
    
        it('debería manejar errores al actualizar el usuario', async () => {
            const idUsuario = usuarioExistente.id;
            const datosActualizados = { nombre_usuario: 'Updated' };
            const errorActualizacion = new Error('Error al actualizar');

            const mockUsuarioInstance = {
                ...usuarioExistente,
                update: jest.fn().mockRejectedValue(errorActualizacion),
            };

            User.findByPk.mockResolvedValueOnce(mockUsuarioInstance);

            await expect(userService.actualizarUsuario(idUsuario, datosActualizados)).rejects.toThrow(errorActualizacion);
            expect(mockUsuarioInstance.update).toHaveBeenCalledWith(datosActualizados);
        });
    });

    describe('eliminarUsuario', () => {
        it('debería eliminar un usuario existente y devolver sus datos', async () => {
            const idUsuario = usuarioExistente.id;

            const mockDestroy = jest.fn().mockResolvedValue(undefined);
            const mockUsuarioInstance = {
                ...usuarioExistente,
                destroy: mockDestroy, // Simula el método destroy
            };

            User.findByPk.mockResolvedValue(mockUsuarioInstance);
        
            const resultado = await userService.eliminarUsuario(idUsuario);
        
            expect(User.findByPk).toHaveBeenCalledWith(idUsuario);
            expect(mockDestroy).toHaveBeenCalledWith();
            expect(resultado).toEqual(mockUsuarioInstance); // Compara con la instancia del usuario
        });

        it('debería devolver null si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);
            const resultado = await userService.eliminarUsuario(999);
            expect(User.findByPk).toHaveBeenCalledWith(999);
            expect(User.destroy).not.toHaveBeenCalled();
            expect(resultado).toBeNull();
        });

        it('debería manejar errores al eliminar el usuario', async () => {
            const idUsuario = usuarioExistente.id;
            const mockDestroy = jest.fn().mockRejectedValue(new Error('Error al eliminar'));
            const mockUsuarioInstanceConError = {
                ...usuarioExistente,
                destroy: mockDestroy,
            };
            User.findByPk.mockResolvedValue(mockUsuarioInstanceConError);
            await expect(userService.eliminarUsuario(idUsuario))
                .rejects.toThrow('Error al eliminar');
            expect(User.findByPk).toHaveBeenCalledWith(idUsuario);
            expect(mockDestroy).toHaveBeenCalledWith();
        });
    });
});