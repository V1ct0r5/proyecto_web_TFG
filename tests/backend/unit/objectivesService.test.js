// Usamos rutas relativas CORRECTAS
jest.mock('../../../backend/src/config/database');
jest.mock('../../../backend/src/api/repositories/objectiveRepository');

const objectivesService = require('../../../backend/src/api/services/objectivesService');
const objectiveRepository = require('../../../backend/src/api/repositories/objectiveRepository');
const db = require('../../../backend/src/config/database');
const { Progress, ActivityLog } = db;

describe('ObjectivesService', () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  };

  beforeEach(() => {
    // La configuración de Jest `clearMocks: true` limpia esto
    db.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it('createObjective debería llamar a los métodos de creación', async () => {
    const objectiveData = { name: 'Aprender', initialValue: 10 };
    const newObjective = { id: 1, ...objectiveData, userId: 1, toJSON: () => newObjective };
    
    objectiveRepository.create.mockResolvedValue(newObjective);
    objectiveRepository.findById.mockResolvedValue(newObjective);

    await objectivesService.createObjective(objectiveData, 1);

    expect(objectiveRepository.create).toHaveBeenCalled();
    expect(Progress.create).toHaveBeenCalled();
    expect(ActivityLog.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});