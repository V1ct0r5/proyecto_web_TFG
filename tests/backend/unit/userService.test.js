const jwt = require('jsonwebtoken');
const userService = require('@/api/services/userService');
const userRepository = require('@/api/repositories/userRepository');
const AppError = require('@/utils/AppError');

// Mockear el repositorio para aislar el servicio
jest.mock('@/api/repositories/userRepository');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('debería crear un usuario correctamente', async () => {
            const userData = { username: 'test', email: 'test@test.com', password: 'password' };
            userRepository.findByEmail.mockResolvedValue(null);
            userRepository.findByUsername.mockResolvedValue(null);
            userRepository.create.mockResolvedValue({ id: 1, ...userData });

            const result = await userService.createUser(userData);
            expect(result).toHaveProperty('id');
            expect(userRepository.create).toHaveBeenCalledWith(userData);
        });

        it('debería lanzar error si el email ya existe', async () => {
            const userData = { username: 'test', email: 'test@test.com', password: 'password' };
            userRepository.findByEmail.mockResolvedValue({});
            await expect(userService.createUser(userData)).rejects.toThrow('El correo electrónico proporcionado ya está registrado.');
        });
    });

    describe('login', () => {
        it('debería devolver token con credenciales correctas', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: 'hashedpassword',
                comparePassword: jest.fn().mockResolvedValue(true),
                toJSON: () => ({ id: 1, email: 'test@test.com' }),
            };
            userRepository.findByEmail.mockResolvedValue(mockUser);
            
            const result = await userService.login('test@test.com', 'password');

            expect(result).toHaveProperty('token');
            expect(result.user.id).toBe(mockUser.id);
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password');

            // --- CORRECCIÓN ---
            // Usar la misma variable de entorno que usa el servicio en modo test.
            const secret = process.env.JWT_SECRET_TEST;
            expect(secret).toBeDefined(); // Pequeña guarda para asegurar que la variable existe.

            const decoded = jwt.verify(result.token, secret);
            expect(decoded.id).toBe(mockUser.id);
        });

        it('debería lanzar error con contraseña incorrecta', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: 'hashedpassword',
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            userRepository.findByEmail.mockResolvedValue(mockUser);

            await expect(userService.login('test@test.com', 'wrongpassword')).rejects.toThrow('El correo electrónico o la contraseña son incorrectos.');
        });

        it('debería lanzar error si el usuario no existe', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            await expect(userService.login('nouser@test.com', 'password')).rejects.toThrow('El correo electrónico o la contraseña son incorrectos.');
        });
    });

    // Puedes añadir más tests para el resto de los métodos si lo necesitas.
});