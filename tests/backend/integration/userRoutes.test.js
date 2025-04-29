// tests/backend/integration/userRoutes.test.js
require('dotenv').config({ path: '../../../.env.test' });
const request = require('supertest');
const app = require('../../../backend/app');
const { sequelize } = require('../../../backend/src/config/database');
const { sequelize: userSequelize } = require('../../../backend/src/config/database');

describe('User Routes', () => {

    beforeAll(async () => {
        // Sincroniza la base de datos de prueba antes de todas las pruebas.
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // Elimina y recrea las tablas de usuarios
    });

    beforeEach(async () => {
        // Sincroniza la base de datos de prueba antes de cada prueba.
        await sequelize.models.Usuario.destroy({ where: {} }); // Limpia la tabla de usuarios
    });

    it('GET /api/usuarios - debería devolver una lista de usuarios', async () => {
        await sequelize.models.Usuario.create({
            nombre_usuario: 'Test User',
            correo_electronico: 'test@example.com',
            contrasena: 'password123',
        });

        const response = await request(app).get('/api/usuarios');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('nombre_usuario');
        expect(response.body[0]).toHaveProperty('correo_electronico');
    });

    it('POST /api/usuarios - debería crear un nuevo usuario', async () => {
        const userData = {
            nombre_usuario: 'New User',
            correo_electronico: 'newuser@example.com',
            contrasena: 'password123',
        };

        const response = await request(app)
            .post('/api/usuarios')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('nombre_usuario');
        expect(response.body).toHaveProperty('correo_electronico');
    });

    it('GET /api/usuarios/:id - debería devolver un usuario específico', async () => {
        // Inserta datos de prueba específicos para esta prueba.
        const createdUser = await sequelize.models.Usuario.create({
            nombre_usuario: 'Specific User',
            correo_electronico: 'specific@example.com',
            contrasena: 'password123',
        });

        const response = await request(app).get(`/api/usuarios/${createdUser.id}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', createdUser.id);
        expect(response.body).toHaveProperty('nombre_usuario', createdUser.nombre_usuario);
        expect(response.body).toHaveProperty('correo_electronico', createdUser.correo_electronico);
    });

    it('PUT /api/usuarios/:id - debería actualizar un usuario existente', async () => {
        // Inserta datos de prueba específicos para esta prueba.
        const createdUser = await sequelize.models.Usuario.create({
            nombre_usuario: 'Original User',
            correo_electronico: 'original@example.com',
            contrasena: 'password123',
        });

        const updatedData = {
            nombre_usuario: 'Updated User',
            correo_electronico: 'updated@example.com',
        };

        const response = await request(app)
            .put(`/api/usuarios/${createdUser.id}`)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', createdUser.id);
        expect(response.body).toHaveProperty('nombre_usuario', updatedData.nombre_usuario);
        expect(response.body).toHaveProperty('correo_electronico', updatedData.correo_electronico);
    });

    it('DELETE /api/usuarios/:id - debería eliminar un usuario existente', async () => {
        // Inserta datos de prueba específicos para esta prueba.
        const createdUser = await sequelize.models.Usuario.create({
            nombre_usuario: 'Delete User',
            correo_electronico: 'delete@example.com',
            contrasena: 'password123',
        });

        const response = await request(app).delete(`/api/usuarios/${createdUser.id}`);
        expect(response.status).toBe(204);

        // Verifica que el usuario se eliminó correctamente.
        const getUserResponse = await request(app).get(`/api/usuarios/${createdUser.id}`);
        expect(getUserResponse.status).toBe(404);
    });

    it('GET /api/usuarios/:id - debería devolver 404 si el usuario no existe', async () => {
        const response = await request(app).get('/api/usuarios/9999');
        expect(response.status).toBe(404);
    });

    afterAll(async () => {
        // Cierra la conexión a la base de datos después de todas las pruebas.
        await sequelize.close();
    });
});