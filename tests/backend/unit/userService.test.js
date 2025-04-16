// tests/backend/unit/userService.test.js
const userService = require('../../../backend/src/services/userService');
const Usuario = require('../../../backend/src/models/usuario');
const bcrypt = require('bcrypt');

jest.mock('../../../backend/src/models/usuario');
jest.mock('bcrypt');

describe('User Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería crear un nuevo usuario', async () => {
        const usuarioData = {
            nombre_usuario: 'Test User',
            correo_electronico: 'test@example.com',
            contrasena: 'password123',
        };

        const salt = 'salt';
        const hashedPassword = 'hashedPassword';

        bcrypt.genSalt.mockResolvedValue(salt);
        bcrypt.hash.mockResolvedValue(hashedPassword);
        Usuario.create.mockResolvedValue(usuarioData);

        const result = await userService.crearUsuario(usuarioData);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith(usuarioData.contrasena, salt);
        expect(Usuario.create).toHaveBeenCalledWith({
            ...usuarioData,
            contrasena: hashedPassword,
        });
        expect(result).toEqual(usuarioData);
    });

    it('debería manejar errores al crear un usuario (bcrypt error)', async () => {
        const usuarioData = {
            nombre_usuario: 'Test User',
            correo_electronico: 'test@example.com',
            contrasena: 'password123',
        };

        bcrypt.genSalt.mockRejectedValue(new Error('Hashing failed'));

        await expect(userService.crearUsuario(usuarioData)).rejects.toThrow('Hashing failed');
    });

    it('debería manejar errores al crear un usuario (Usuario.create error)', async () => {
        const usuarioData = {
            nombre_usuario: 'Test User',
            correo_electronico: 'test@example.com',
            contrasena: 'password123',
        };

        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hashedPassword');
        Usuario.create.mockRejectedValue(new Error('Database error'));

        await expect(userService.crearUsuario(usuarioData)).rejects.toThrow('Database error');
    });
});