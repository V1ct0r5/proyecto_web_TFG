const request = require('supertest');
const app = require('@/../app');
const { setupUserAndLogin } = require('./helpers/setup');
const fs = require('fs');
const path = require('path');

describe('Profile Routes', () => {
    let token;
    beforeEach(async () => {
        const auth = await setupUserAndLogin('profile@test.com', 'profile_user');
        token = auth.token;
    });

    it('GET /api/profile - debería devolver el perfil', async () => {
        const res = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`).expect(200);
        expect(res.body.data.username).toBe('profile_user');
    });

    it('PATCH /api/profile - debería actualizar el perfil', async () => {
        const res = await request(app).patch('/api/profile').set('Authorization', `Bearer ${token}`).send({ bio: 'New bio' }).expect(200);
        expect(res.body.data.bio).toBe('New bio');
    });

    it('PATCH /api/profile - debería actualizar el avatar', async () => {
        const imagePath = path.join(__dirname, 'test-avatar.png');
        if (!fs.existsSync(imagePath)) fs.writeFileSync(imagePath, 'fake-data');
        const res = await request(app).patch('/api/profile').set('Authorization', `Bearer ${token}`).attach('avatar', imagePath).expect(200);
        expect(res.body.data.avatarUrl).toBeDefined();
        fs.unlinkSync(imagePath);
        const avatarDiskPath = path.join(__dirname, '../../../public', res.body.data.avatarUrl);
        if(fs.existsSync(avatarDiskPath)) fs.unlinkSync(avatarDiskPath);
    });
});