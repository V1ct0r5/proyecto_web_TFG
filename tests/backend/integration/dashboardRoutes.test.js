const request = require('supertest');
const app = require('@/../app');
const { Objective } = require('@/config/database');
const { setupUserAndLogin } = require('./helpers/setup');

describe('Dashboard Routes', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const auth = await setupUserAndLogin('dashuser@test.com', 'dashboard_user');
        token = auth.token;
        userId = auth.userId;
        await Objective.bulkCreate([
            { name: 'Completed Obj', userId, category: 'HEALTH', status: 'COMPLETED' },
            { name: 'In Progress Obj', userId, category: 'HEALTH', status: 'IN_PROGRESS' },
            { name: 'Archived Obj', userId, category: 'CAREER', status: 'ARCHIVED' },
        ]);
    });

    it('GET /api/dashboard/summary-stats - debería devolver estadísticas correctas', async () => {
        const res = await request(app).get('/api/dashboard/summary-stats').set('Authorization', `Bearer ${token}`).expect(200);
        expect(res.body.data.totalObjectives).toBe(2);
        expect(res.body.data.statusCounts.COMPLETED).toBe(1);
    });

    it('GET /api/dashboard/recent-objectives - debería devolver objetivos recientes', async () => {
        const res = await request(app).get('/api/dashboard/recent-objectives?limit=2').set('Authorization', `Bearer ${token}`).expect(200);
        expect(res.body.data).toHaveLength(2);
    });
});