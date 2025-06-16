const request = require('supertest');
const app = require('@/../app');
const { User } = require('@/config/database');
const { setupUserAndLogin } = require('./helpers/setup');

describe('Settings Routes', () => {
    let token;
    let userId;
    const creds = { email: 'settings@test.com', username: 'settings_user', password: 'oldPassword' };

    beforeEach(async () => {
        const auth = await setupUserAndLogin(creds.email, creds.username, creds.password);
        token = auth.token;
        userId = auth.userId;
    });

    it('PUT /api/settings - debería actualizar las preferencias', async () => {
        await request(app).put('/api/settings').set('Authorization', `Bearer ${token}`).send({ themePreference: 'dark' }).expect(200);
        const user = await User.findByPk(userId);
        expect(user.themePreference).toBe('dark');
    });

    it('PUT /api/settings/change-password - debería cambiar la contraseña', async () => {
        await request(app).put('/api/settings/change-password').set('Authorization', `Bearer ${token}`).send({ currentPassword: creds.password, newPassword: 'newPassword' }).expect(200);
        await request(app).post('/api/auth/login').send({ email: creds.email, password: 'newPassword' }).expect(200);
    });

    it('DELETE /api/settings/account - debería eliminar la cuenta', async () => {
        await request(app).delete('/api/settings/account').set('Authorization', `Bearer ${token}`).expect(200);
        const user = await User.findByPk(userId);
        expect(user).toBeNull();
    });
});