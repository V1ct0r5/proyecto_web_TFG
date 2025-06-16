// tests/backend/unit/analysisService.test.js

// Este mock ahora encontrará el archivo en backend/src/config/__mocks__/database.js
jest.mock('@/config/database');

// Este mock puede ser automático, lo configuraremos igual
jest.mock('@/api/services/objectivesService');

const analysisService = require('@/api/services/analysisService');
const { calculateProgressPercentage } = require('@/api/services/objectivesService');
const db = require('@/config/database');
const { Objective, Progress } = db;

// Función de cálculo robusta para el mock
const mockCalculateProgress = (payload) => {
    const initial = parseFloat(payload.initialValue);
    const current = parseFloat(payload.currentValue);
    const target = parseFloat(payload.targetValue);
    if (isNaN(initial) || isNaN(current) || isNaN(target) || target === initial) return 0;
    const totalDistance = target - initial;
    const currentDistance = current - initial;
    let progress = (currentDistance / totalDistance) * 100;
    const clampedProgress = Math.max(0, Math.min(100, progress));
    return isNaN(clampedProgress) ? 0 : clampedProgress;
};

describe('AnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMonthlyProgress debería calcular el progreso correctamente', async () => {
    const mockObjectives = [
        { id_objetivo: 1, valor_inicial_numerico: '0.00', valor_cuantitativo: '100.00', es_menor_mejor: false, created_at: '2023-01-15T12:00:00.000Z' },
        { id_objetivo: 2, valor_inicial_numerico: '50.00', valor_cuantitativo: '100.00', es_menor_mejor: false, created_at: '2023-02-05T12:00:00.000Z' },
    ];
    const mockProgressEntries = [
        { id_objetivo: 1, valor_actual: '20.00', fecha_registro: '2023-01-20' },
        { id_objetivo: 1, valor_actual: '40.00', fecha_registro: '2023-02-10' },
        { id_objetivo: 2, valor_actual: '75.00', fecha_registro: '2023-02-20' },
    ];
    
    // Ahora estos mocks se aplicarán a los mocks manuales de __mocks__
    Objective.findAll.mockResolvedValue(mockObjectives);
    Progress.findAll.mockResolvedValue(mockProgressEntries);
    calculateProgressPercentage.mockImplementation(mockCalculateProgress);

    jest.useFakeTimers().setSystemTime(new Date('2023-03-15'));
    const result = await analysisService.getMonthlyProgress(1, '3months');
    jest.useRealTimers();
    
    const januaryResult = result.find(r => r.monthYear === '2023-01');
    const februaryResult = result.find(r => r.monthYear === '2023-02');
    
    expect(januaryResult).toBeDefined();
    expect(februaryResult).toBeDefined();
    expect(calculateProgressPercentage).toHaveBeenCalled();
    expect(januaryResult.averageProgress).toBe(20);
    expect(februaryResult.averageProgress).toBe(45);
  });
});