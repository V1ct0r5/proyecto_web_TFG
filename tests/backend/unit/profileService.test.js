// tests/backend/unit/profileService.test.js

// Usamos el alias @/ que está configurado en jest.config.unit.js
jest.mock('@/config/database');
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(),
  },
}));

// Importamos los módulos necesarios para el test
const profileService = require('@/api/services/profileService');
const db = require('@/config/database');
const { User, Objective } = db;

describe('ProfileService', () => {
  const userId = 1;

  it('fetchUserProfile debería devolver un perfil si se encuentra', async () => {
    User.findByPk.mockResolvedValue({ toJSON: () => ({ id: userId }) });
    await profileService.fetchUserProfile(userId);
    expect(User.findByPk).toHaveBeenCalledWith(userId, expect.any(Object));
  });
  
  it('fetchUserStats debería calcular las estadísticas', async () => {
    const mockObjectives = [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS' }];
    Objective.findAll.mockResolvedValue(mockObjectives);
    const stats = await profileService.fetchUserStats(userId);
    expect(stats.totalObjectives).toBe(2);
  });
});