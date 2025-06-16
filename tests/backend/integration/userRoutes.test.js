const request = require('supertest');
const app = require('@/../app');
const { setupUserAndLogin } = require('./helpers/setup');
const { User } = require('@/config/database');

describe('User Routes (Protected)', () => {
    let token, userId, otherUserToken, otherUserId;
    beforeEach(async () => {
        const auth1 = await setupUserAndLogin('user1@test.com', 'user1');
        token = auth1.token;
        userId = auth1.userId;
        const auth2 = await setupUserAndLogin('user2@test.com', 'user2');
        otherUserId = auth2.userId;
    });

    it('GET /api/users/:id - debería permitir obtener su propia info', async () => {
        await request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`).expect(200);
    });
    it('GET /api/users/:id - debería denegar obtener info de otro', async () => {
        await request(app).get(`/api/users/${otherUserId}`).set('Authorization', `Bearer ${token}`).expect(403);
    });
    it('DELETE /api/users/:id - debería permitir eliminar su propia cuenta', async () => {
        await request(app).delete(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`).expect(204);
        const user = await User.findByPk(userId);
        expect(user).toBeNull();
    });
});