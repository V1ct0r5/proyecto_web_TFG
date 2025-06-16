const request = require('supertest');
const app = require('@/../app');
const { Objective } = require('@/config/database');
const { setupUserAndLogin } = require('./helpers/setup');

describe('Objectives Routes', () => {
  let token;
  let userId;
  beforeEach(async () => {
    const auth = await setupUserAndLogin('objuser@test.com', 'objective_user');
    token = auth.token;
    userId = auth.userId;
  });

  describe('POST /api/objectives', () => {
    it('debería crear un nuevo objetivo', async () => {
      const objectiveData = { name: 'Aprender testing', category: 'PERSONAL_DEV' };
      const res = await request(app).post('/api/objectives').set('Authorization', `Bearer ${token}`).send(objectiveData).expect(201);
      expect(res.body.data.objective.userId).toBe(userId);
    });
    it('debería fallar con 401 sin token', async () => {
      await request(app).post('/api/objectives').send({ name: 'Fail' }).expect(401);
    });
    it('debería fallar con 400 con datos inválidos', async () => {
      await request(app).post('/api/objectives').set('Authorization', `Bearer ${token}`).send({ name: 'A' }).expect(400);
    });
  });

  describe('GET /api/objectives', () => {
    beforeEach(async () => {
      await Objective.create({ name: 'My Obj 1', userId, category: 'HEALTH' });
      const otherAuth = await setupUserAndLogin('other@test.com', 'other');
      await Objective.create({ name: 'Other User Obj', userId: otherAuth.userId, category: 'OTHER' });
    });
    it('debería devolver solo los objetivos del usuario autenticado', async () => {
      const res = await request(app).get('/api/objectives').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body.data.objectives).toHaveLength(1);
    });
  });

  describe('PUT /api/objectives/:id', () => {
    it('debería actualizar un objetivo', async () => {
      const obj = await Objective.create({ name: 'Old Name', userId, category: 'CAREER' });
      const res = await request(app).put(`/api/objectives/${obj.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'New Name' }).expect(200);
      expect(res.body.data.objective.name).toBe('New Name');
    });
  });

  describe('DELETE /api/objectives/:id', () => {
    it('debería eliminar un objetivo', async () => {
      const obj = await Objective.create({ name: 'To Delete', userId, category: 'OTHER' });
      await request(app).delete(`/api/objectives/${obj.id}`).set('Authorization', `Bearer ${token}`).expect(204);
      const dbObjective = await Objective.findByPk(obj.id);
      expect(dbObjective).toBeNull();
    });
  });
});