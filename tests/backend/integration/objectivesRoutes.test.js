const request = require('supertest');
const app = require('../../../backend/app');
const { sequelize } = require('../../../backend/src/models/objetives');


describe('Objectives Routes', () => {
    beforeEach(async () => {
        // Sincroniza la base de datos de prueba antes de cada prueba.
        await sequelize.sync({ force: true }); // Elimina y recrea las tablas
    });

    it('GET /api/objetivos - debería devolver una lista de objetivos', async () => {
        await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Test Objective',
            descripcion: 'Description of the test objective',
            tipo_objetivo: 'Health',
            valor_cuantitativo: 100,
            unidad_medida: 'kg',
            fecha_inicio: new Date(),
            fecha_fin: '2025-06-01',
            estado: 'Pendiente',
        });

        const response = await request(app).get('/api/objetivos');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('id_objetivo');
        expect(response.body[0]).toHaveProperty('nombre_objetivo');
        expect(response.body[0]).toHaveProperty('descripcion');
        expect(response.body[0]).toHaveProperty('tipo_objetivo');
        expect(response.body[0]).toHaveProperty('estado', 'Pendiente');
    });

    it('POST /api/objetivos - debería crear un nuevo objetivo', async () => {
        const objectiveData = {
            nombre_objetivo: 'Mejorar salud',
            descripcion: 'Perder peso y mejorar la salud general',
            tipo_objetivo: 'Health',
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
        expect(response.body).toHaveProperty('descripcion', objectiveData.descripcion);
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
        });

        const response = await request(app).get(`/api/objetivos/${createdObjective.id_objetivo}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id_objetivo', createdObjective.id_objetivo);
        expect(response.body).toHaveProperty('nombre_objetivo', createdObjective.nombre_objetivo);
        expect(response.body).toHaveProperty('descripcion', createdObjective.descripcion);
    });

    it('PUT /api/objetivos/:id - debería actualizar un objetivo existente', async () => {
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
            descripcion: 'Descripción actualizada',
            tipo_objetivo: 'Salud',
            valor_cuantitativo: 70,
            unidad_medida: 'kg',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'En progreso',
        };

        const response = await request(app)
            .put(`/api/objetivos/${createdObjective.id_objetivo}`)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id_objetivo', createdObjective.id_objetivo);
        expect(response.body).toHaveProperty('nombre_objetivo', updatedData.nombre_objetivo);
        expect(response.body).toHaveProperty('descripcion', updatedData.descripcion);
        expect(response.body).toHaveProperty('valor_cuantitativo', updatedData.valor_cuantitativo);
        expect(response.body).toHaveProperty('estado', updatedData.estado);
    });

    it('DELETE /api/objetivos/:id - debería eliminar un objetivo existente', async () => {
        const createdObjective = await sequelize.models.Objetivo.create({
            nombre_objetivo: 'Objetivo a Eliminar',
            descripcion: 'Descripción del objetivo a eliminar',
            tipo_objetivo: 'Productividad',
            valor_cuantitativo: 5,
            unidad_medida: 'horas',
            fecha_inicio: new Date(),
            fecha_fin: '2025-12-31',
            estado: 'Pendiente',
        });

        const response = await request(app)
            .delete(`/api/objetivos/${createdObjective.id_objetivo}`);

        expect(response.status).toBe(204);

        const getObjectiveResponse = await request(app)
            .get(`/api/objetivos/${createdObjective.id_objetivo}`);

        expect(getObjectiveResponse.status).toBe(404);
    });

    it('GET /api/objetivos/:id - debería devolver 404 si el objetivo no existe', async () => {
        const response = await request(app).get('/api/objetivos/999999');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Objetivo no encontrado');
    });

    afterAll(async () => {
        // Cierra la conexión a la base de datos después de todas las pruebas.
        await sequelize.close();
    });
});