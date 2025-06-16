const request = require('supertest');
const app = require('@/../app');
const { Objective } = require('@/config/database');
const { setupUserAndLogin } = require('./helpers/setup');

describe('Analysis Routes', () => {
    let token;
    let userId;
    beforeEach(async () => {
        const auth = await setupUserAndLogin('analysisuser@test.com', 'analysis_user');
        token = auth.token;
        userId = auth.userId;
        await Objective.bulkCreate([
            { name: 'Health A', userId, category: 'HEALTH', status: 'COMPLETED' },
            { name: 'Health B', userId, category: 'HEALTH', status: 'IN_PROGRESS' },
        ]);
    });

    it('GET /api/analysis/category-distribution - debería devolver la distribución por categoría', async () => {
        const res = await request(app).get('/api/analysis/category-distribution').set('Authorization', `Bearer ${token}`).expect(200);
        // --- CORRECCIÓN ---
        // Comparamos con un número, no con un string.
        expect(res.body.data.find(d => d.name === 'HEALTH').value).toBe(2);
    });
});