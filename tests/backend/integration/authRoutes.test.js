const request = require('supertest');
const app = require('@/../app');
const { User } = require('@/config/database');

describe('Auth Routes', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('debería registrar a un nuevo usuario y devolver un token', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser).expect(201);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('token');
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).not.toBeNull();
    });

    it('debería devolver error 400 si las contraseñas no coinciden', async () => {
      await request(app).post('/api/auth/register').send({ ...testUser, confirmPassword: 'wrong' }).expect(400);
    });

    it('debería devolver error 409 si el email ya existe', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      await request(app).post('/api/auth/register').send(testUser).expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });
    it('debería autenticar a un usuario y devolver un token', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password }).expect(200);
      expect(res.body).toHaveProperty('token');
    });
    it('debería devolver error 401 con credenciales incorrectas', async () => {
      await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrong' }).expect(401);
    });
  });
});