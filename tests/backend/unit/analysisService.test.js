jest.mock('@/config/database');
jest.mock('@/api/services/objectivesService');

const analysisService = require('@/api/services/analysisService');
const db = require('@/config/database');
const { Objective } = db;
const { calculateProgressPercentage } = require('@/api/services/objectivesService');

describe('AnalysisService', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMonthlyProgress', () => {

        it('debería calcular el progreso promedio correctamente para cada mes', async () => {
            const mockObjectives = [
                {
                    id: 1,
                    createdAt: new Date('2024-01-10'),
                    initialValue: 0,
                    targetValue: 100,
                    isLowerBetter: false,
                    toJSON: function() { return this },
                    progressEntries: [
                        { value: 20, entryDate: '2024-01-20' },
                        { value: 50, entryDate: '2024-02-15' },
                    ]
                },
                {
                    id: 2,
                    createdAt: new Date('2024-02-05'),
                    initialValue: 100,
                    targetValue: 50,
                    isLowerBetter: true,
                    toJSON: function() { return this },
                    progressEntries: [
                        { value: 75, entryDate: '2024-02-20' },
                    ]
                }
            ];

            Objective.findAll.mockResolvedValue(mockObjectives);

            calculateProgressPercentage.mockImplementation(objData => {
                const initial = parseFloat(objData.initialValue);
                const current = parseFloat(objData.currentValue);
                const target = parseFloat(objData.targetValue);
                if (isNaN(initial) || isNaN(current) || isNaN(target) || target === initial) return 0;
                let progress = objData.isLowerBetter 
                    ? ((initial - current) / (initial - target)) * 100
                    : ((current - initial) / (target - initial)) * 100;
                return Math.round(Math.max(0, Math.min(100, progress)));
            });

            jest.useFakeTimers().setSystemTime(new Date('2024-03-15T12:00:00.000Z'));
            const result = await analysisService.getMonthlyProgress(1, '3months');
            jest.useRealTimers();

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ monthYear: '2024-01', averageProgress: 20 });
            expect(result[1]).toEqual({ monthYear: '2024-02', averageProgress: 50 });
            expect(result[2]).toEqual({ monthYear: '2024-03', averageProgress: 50 });
        });

        it('debería devolver un array vacío si no hay objetivos', async () => {
            Objective.findAll.mockResolvedValue([]);
            
            jest.useFakeTimers().setSystemTime(new Date('2024-03-15'));
            const result = await analysisService.getMonthlyProgress(1, '3months');
            jest.useRealTimers();

            expect(result).toEqual([]);
        });

    });

});