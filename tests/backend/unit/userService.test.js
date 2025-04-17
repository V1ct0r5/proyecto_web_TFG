// tests/unit/users.service.test.js
const userService = require('../../src/api/services/userService');
const User = require('../../src/api/models/user.model');
const bcrypt = require('bcrypt');

jest.mock('../../src/api/models/user.model');
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
            const nuevoNombre = 'Updated User';
            const usuarioActualizado = { ...usuarioExistente, nombre_usuario: nuevoNombre };

            User.findByPk.mockResolvedValue(usuarioExistente);
            User.update.mockResolvedValue([1]);
            User.findByPk.mockResolvedValue(usuarioActualizado);

            const resultado = await userService.actualizarUsuario(usuarioExistente.id, { nombre_usuario: nuevoNombre });

            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(User.update).toHaveBeenCalledWith({ nombre_usuario: nuevoNombre }, { where: { id: usuarioExistente.id } });
            expect(resultado).toEqual(usuarioActualizado);
        });

        it('debería actualizar la contraseña si se proporciona', async () => {
            const nuevaContrasena = 'newPassword';
            const nuevoHashedPassword = 'newHashedPassword';
            const usuarioActualizado = { ...usuarioExistente, contrasena: nuevoHashedPassword };

            User.findByPk.mockResolvedValue(usuarioExistente);
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(nuevoHashedPassword);
            User.update.mockResolvedValue([1]);
            User.findByPk.mockResolvedValue(usuarioActualizado);

            const resultado = await userService.actualizarUsuario(usuarioExistente.id, { contrasena: nuevaContrasena });

            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(nuevaContrasena, salt);
            expect(User.update).toHaveBeenCalledWith(
                { contrasena: nuevoHashedPassword },
                { where: { id: usuarioExistente.id } }
            );
            expect(resultado).toEqual(usuarioActualizado);
        });

        it('debería devolver null si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);
            const resultado = await userService.actualizarUsuario(999, { nombre_usuario: 'Nuevo' });
            expect(resultado).toBeNull();
            expect(User.update).not.toHaveBeenCalled();
        });

        it('no debería hashear la contraseña si no se proporciona', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            User.update.mockResolvedValue([1]);
            User.findByPk.mockResolvedValue({ ...usuarioExistente, nombre_usuario: 'Nuevo' });

            await userService.actualizarUsuario(usuarioExistente.id, { nombre_usuario: 'Nuevo' });

            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });

        it('debería manejar errores al actualizar el usuario', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            User.update.mockRejectedValue(new Error('Error al actualizar'));

            await expect(userService.actualizarUsuario(usuarioExistente.id, { nombre_usuario: 'Updated' })).rejects.toThrow('Error al actualizar');
        });
    });

    describe('eliminarUsuario', () => {
        it('debería eliminar un usuario existente y devolver sus datos', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            User.destroy.mockResolvedValue(1);

            const resultado = await userService.eliminarUsuario(usuarioExistente.id);

            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(User.destroy).toHaveBeenCalledWith({ where: { id: usuarioExistente.id } });
            expect(resultado).toEqual({ message: 'Usuario eliminado correctamente', id: usuarioExistente.id });
        });

        it('debería devolver null si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);
            const resultado = await userService.eliminarUsuario(999);
            expect(User.findByPk).toHaveBeenCalledWith(999);
            expect(User.destroy).not.toHaveBeenCalled();
            expect(resultado).toBeNull();
        });

        it('debería manejar errores al eliminar el usuario', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            User.destroy.mockRejectedValue(new Error('Error al eliminar'));

            await expect(userService.eliminarUsuario(usuarioExistente.id)).rejects.toThrow('Error al eliminar');
        });
    });
});