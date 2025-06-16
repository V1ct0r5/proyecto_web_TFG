// Usamos rutas relativas CORRECTAS
jest.mock('../../../backend/src/config/database');
jest.mock('../../../backend/src/api/services/objectivesService');

const dashboardService = require('../../../backend/src/api/services/dashboardService');
const { Objective, ActivityLog } = require('../../../backend/src/config/database');
const { calculateProgressPercentage } = require('../../../backend/src/api/services/objectivesService');

describe('DashboardService', () => {
  const userId = 1;

  it('calculateSummaryStats debería calcular las estadísticas correctamente', async () => {
    Objective.count
      .mockResolvedValueOnce(5) // totalObjectives
      .mockResolvedValueOnce(1); // dueSoonCount
    
    // El mock debe devolver objetos con .toJSON()
    const mockQuantitativeObjectives = [
        { toJSON: () => ({ id: 1 }) },
        { toJSON: () => ({ id: 2 }) }
    ];

    Objective.findAll
      .mockResolvedValueOnce([{ status: 'COMPLETED', count: 2 }, { status: 'IN_PROGRESS', count: 3 }])
      .mockResolvedValueOnce(mockQuantitativeObjectives)
      .mockResolvedValueOnce([{ category: 'HEALTH', count: 4 }]); 
      
    calculateProgressPercentage.mockReturnValue(75);

    const stats = await dashboardService.calculateSummaryStats(userId);

    expect(stats.totalObjectives).toBe(5);
    expect(stats.statusCounts).toEqual({ COMPLETED: 2, IN_PROGRESS: 3 });
    expect(stats.averageProgress).toBe(75);
  });

  it('fetchRecentObjectives debería devolver objetivos recientes', async () => {
    // Este mock también necesita .toJSON()
    const mockRecentObjectives = [
        { toJSON: () => ({ id: 1, name: 'Obj 1' }) },
        { toJSON: () => ({ id: 2, name: 'Obj 2' }) }
    ];
    Objective.findAll.mockResolvedValue(mockRecentObjectives);
    calculateProgressPercentage.mockReturnValue(50);

    const result = await dashboardService.fetchRecentObjectives(userId, 2);

    expect(result).toHaveLength(2);
    expect(result[0].progressPercentage).toBe(50);
  });
});