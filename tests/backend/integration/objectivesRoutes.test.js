require('dotenv').config({ path: '../../../.env.test' });
const request = require('supertest');
const app = require('../../../backend/app');
const { sequelize } = require('../../../backend/src/config/database');
const { userSequelize } = require('../../../backend/src/config/database');
const jwt = require('jsonwebtoken');


describe('Objectives Routes', () => {
    let user;
    let token;

    beforeAll(async () => {
        // Sincroniza la base de datos de prueba antes de todas las pruebas.
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // Elimina y recrea las tablas de objetivos
        await userSequelize.sync({ force: true }); // Elimina y recrea las tablas de usuarios
    });
    beforeEach(async () => {
        await sequelize.sync({ force: true }); // Elimina y recrea las tablas de objetivos
        await userSequelize.sync({ force: true }); // Elimina y recrea las tablas de usuarios

        user = await userSequelize.models.User.create({
            nombre_usuario: 'testuser',
            correo_electronico: 'test@example.com',
            contrasena: 'password123',
        });
        token = jwt.sign({ id_usuario: user.id_usuario }, process.env.JWT_SECRET_TEST, { expiresIn: JWT_EXPIRATION_TIME });
    });

    afterAll(async () => {
        // Cierra la conexión a la base de datos después de todas las pruebas.
        await sequelize.close();
        if(userSequelize && userSequelize !== sequelize) {
            await userSequelize.close();
        }
    });

    const authHeader = {
        Authorization: `Bearer ${token}`,
    };

    it('GET /api/objetivos - debería devolver una lista de objetivos', async () => {
        await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Test Objective',
            descripcion: 'Description of the test objective',
            tipo_objetivo: 'Salud',
            valor_cuantitativo: 100,
            unidad_medida: 'kg',
            fecha_inicio: new Date(),
            fecha_fin: '2025-06-01',
            estado: 'Pendiente',
            id_usuario: user.id_usuario,
        });

        await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Another Objective',
            descripcion: 'Description of another objective',
            tipo_objetivo: 'Desarrollo personal',
            valor_cuantitativo: 50,
            unidad_medida: 'horas',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
            id_usuario: user.id_usuario,
        });

        const response = await request(app)
            .get('/api/objetivos')
            .set('Authorization', authHeader); 

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(2); // Verifica que se devuelven dos objetivos del usuario actualmente autenticado
        expect(response.body[0]).toHaveProperty('id_objetivo');
        expect(response.body[0]).toHaveProperty('nombre_objetivo', 'Test Objective');
        expect(response.body[0]).toHaveProperty('id_usuario', user.id_usuario);
        expect(response.body[0]).toHaveProperty('tipo_objetivo');
        expect(response.body[0]).toHaveProperty('estado', 'Pendiente');
        expect(response.body[1]).toHaveProperty('id_objetivo');
        expect(response.body[1]).toHaveProperty('nombre_objetivo', 'Another Objective');
        expect(response.body[1]).toHaveProperty('id_usuario', user.id_usuario);
        expect(response.body[1]).toHaveProperty('tipo_objetivo');
        expect(response.body[1]).toHaveProperty('estado', 'Pendiente');
    });

    it('POST /api/objetivos - debería crear un nuevo objetivo', async () => {
        const objectiveData = {
            nombre_objetivo: 'Mejorar salud',
            descripcion: 'Perder peso y mejorar la salud general',
            tipo_objetivo: 'Salud',
            valor_cuantitativo: 75,
            unidad_medida: 'kg',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
        };

        const response = await request(app)
            .post('/api/objetivos')
            .send(objectiveData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id_objetivo');
        expect(response.body).toHaveProperty('nombre_objetivo', objectiveData.nombre_objetivo);
        expect(response.body).toHaveProperty('id_usuario', user.id_usuario);
    });

    it('GET /api/objetivos/:id - debería devolver un objetivo específico', async () => {
        // Inserta datos de prueba específicos para esta prueba.
        const createdObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Objetivo Específico',
            descripcion: 'Descripción del objetivo específico',
            tipo_objetivo: 'Productividad',
            valor_cuantitativo: 10,
            unidad_medida: 'horas',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
            id_usuario: user.id_usuario,
        });

        const response = await request(app)
            .get(`/api/objetivos/${createdObjective.id_objetivo}`)
            .set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id_objetivo', createdObjective.id_objetivo);
        expect(response.body).toHaveProperty('nombre_objetivo', createdObjective.nombre_objetivo);
        expect(response.body).toHaveProperty('id_usuario', user.id_usuario);
    });

    it('GET /api/objetivos/:id - debería devolver 404 si el objetivo no pertenece al usuario', async () => {
        const otherObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Otro Objetivo',
            descripcion: 'Descripción de otro objetivo',
            tipo_objetivo: 'Finanzas',
            valor_cuantitativo: 1000,
            unidad_medida: 'USD',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
            id_usuario: 999, // ID de usuario que no existe
        });

        const response = await request(app)
            .get('/api/objetivos/${otherObjective.id_objetivo}')
            .set('Authorization', authHeader);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Objetivo no encontrado');
    });

    it('PUT /api/objetivos/:id - debería actualizar un objetivo existente del usuario', async () => {
        const createdObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Objetivo Original',
            descripcion: 'Descripción original',
            tipo_objetivo: 'Salud',
            valor_cuantitativo: 80,
            unidad_medida: 'kg',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
        });

        const updatedData = {
            nombre_objetivo: 'Objetivo Actualizado',
            estado: 'En progreso',
        };

        const response = await request(app)
            .put(`/api/objetivos/${createdObjective.id_objetivo}`)
            .set('Authorization', authHeader)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id_objetivo', createdObjective.id_objetivo);
        expect(response.body).toHaveProperty('nombre_objetivo', updatedData.nombre_objetivo);
        expect(response.body).toHaveProperty('estado', updatedData.estado);
        expect(response.body).toHaveProperty('id_usuario', user.id_usuario);
    });

    it('DELETE /api/objetivos/:id - debería eliminar un objetivo existente del usuario autenticado', async () => {
        const createdObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Objetivo a Eliminar',
            descripcion: 'Descripción del objetivo a eliminar',
            tipo_objetivo: 'Desarrollo personal',
            valor_cuantitativo: 5,
            unidad_medida: 'horas',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
        });

        const response = await request(app)
            .delete(`/api/objetivos/${createdObjective.id_objetivo}`)
            .set('Authorization', authHeader);

        expect(response.status).toBe(204);

        const getObjectiveResponse = await request(app)
            .get(`/api/objetivos/${createdObjective.id_objetivo}`)
            .set('Authorization', authHeader);

        expect(getObjectiveResponse.status).toBe(404);
    });

    it('DELETE /api/objetivos/:id - debería devolver 404 si el objetivo no pertenece al usuario', async () => {
        const createdObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Objetivo a Eliminar',
            descripcion: 'Descripción del objetivo a eliminar',
            tipo_objetivo: 'Desarrollo personal',
            valor_cuantitativo: 5,
            unidad_medida: 'horas',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
            id_usuario: 999, // ID de usuario que no existe
        });
        const response = await request(app)
            .delete('/api/objetivos/${createdObjective.id_objetivo}')
            .set('Authorization', authHeader);

        expect(response.status).toBe(404);
    });

});