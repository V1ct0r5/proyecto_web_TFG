const request = require('supertest');
const app = require('@/../app');

const setupUserAndLogin = async (email, username, password = 'password123') => {
    await request(app)
        .post('/api/auth/register')
        .send({ username, email, password, confirmPassword: password });

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    if (!loginRes.body.token) {
        throw new Error(`No se pudo obtener el token para ${email} en el setup del test.`);
    }
    return { token: loginRes.body.token, userId: loginRes.body.user.id };
};

module.exports = { setupUserAndLogin };