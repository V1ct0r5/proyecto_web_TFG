// tests/unit/usersService.test.js
const userService = require('../../../backend/src/api/services/userService');
const User = require('../../../backend/src/api/models/user');
const bcrypt = require('bcrypt');

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
            const mockedHashedPassword = 'mockedHashedPassword';
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            User.create.mockResolvedValue(usuarioExistente);

            const resultado = await userService.crearUsuario(usuarioDataValido);
            expect(User.findOne).toHaveBeenCalledWith({ where: { correo_electronico: usuarioDataValido.correo_electronico } });
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(usuarioDataValido.contrasena, salt);
            expect(User.create).toHaveBeenCalledWith({ ...usuarioDataValido, contrasena: mockedHashedPassword });
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
            const mockUpdateResult = [1]; // Simulate successful update

            User.findByPk.mockResolvedValue(usuarioExistente); // Simula solo la búsqueda
            User.update.mockResolvedValue(mockUpdateResult); // Simula la actualización
            User.findByPk.mockResolvedValue(usuarioActualizado); // Simula la obtención del usuario actualizado

            const resultado = await userService.actualizarUsuario(usuarioExistente.id, { nombre_usuario: nuevoNombre });

            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(User.update).toHaveBeenCalledWith({ nombre_usuario: nuevoNombre }, { where: { id: usuarioExistente.id } });
            expect(resultado).toEqual(usuarioActualizado);
        });

        it('debería actualizar la contraseña si se proporciona', async () => {
            const nuevaContrasena = 'newPassword';
            const nuevoHashedPassword = 'newHashedPassword';
            const usuarioActualizado = { ...usuarioExistente, contrasena: nuevoHashedPassword };
            const mockUpdateResult = [1];
    
            User.findByPk.mockResolvedValue(usuarioExistente);
            bcrypt.genSalt.mockResolvedValue(salt);
            bcrypt.hash.mockResolvedValue(nuevoHashedPassword);
            User.update.mockResolvedValue(mockUpdateResult);
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
            expect(User.update).toHaveBeenCalledWith({ nombre_usuario: 'Nuevo' }, { where: { id: usuarioExistente.id } });
        });
    
        it('debería manejar errores al actualizar el usuario', async () => {
            User.findByPk.mockResolvedValue(usuarioExistente);
            User.update.mockRejectedValue(new Error('Error al actualizar'));
    
            await expect(userService.actualizarUsuario(usuarioExistente.id, { nombre_usuario: 'Updated' })).rejects.toThrow('Error al actualizar');
            expect(User.update).toHaveBeenCalledWith({ nombre_usuario: 'Updated' }, { where: { id: usuarioExistente.id } });
        });
    });

    describe('eliminarUsuario', () => {
        it('debería eliminar un usuario existente y devolver sus datos', async () => {
            User.findByPk.mockResolvedValue({
                ...usuarioExistente,
                destroy: jest.fn().mockResolvedValue(1), // Simula la función destroy directamente en el objeto
            });

            const resultado = await userService.eliminarUsuario(usuarioExistente.id);

            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(User.findByPk.mock.results[0].value.destroy).toHaveBeenCalledWith();
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
            User.findByPk.mockResolvedValue({
                ...usuarioExistente,
                destroy: jest.fn().mockRejectedValue(new Error('Error al eliminar')), // Simula el error en destroy
            });

            await expect(userService.eliminarUsuario(usuarioExistente.id)).rejects.toThrow('Error al eliminar');
            expect(User.findByPk).toHaveBeenCalledWith(usuarioExistente.id);
            expect(User.findByPk.mock.results[0].value.destroy).toHaveBeenCalledWith();
        });
    });
});