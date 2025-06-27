const { Op, fn, col, literal } = require('sequelize');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objective, Progress } = db;

class AnalysisService {
    _getDateRange(period) {
        const endDate = new Date();
        let startDate = new Date();
        switch (period) {
            case '1month': startDate.setMonth(endDate.getMonth() - 1); break;
            case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
            case '1year': startDate.setFullYear(endDate.getFullYear() - 1); break;
            case 'all': startDate = new Date(0); break;
            case '3months':
            default:
                startDate.setMonth(endDate.getMonth() - 3);
                break;
        }
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
    }

    async getAnalysisSummary(userId, period = '3months') {
        // --- CORRECCIÓN 1: Importar la función ---
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        const baseWhere = { userId, status: { [Op.not]: 'ARCHIVED' } };
        try {
            const totalObjectives = await Objective.count({ where: { userId } });
            const activeObjectives = await Objective.count({ where: { ...baseWhere, status: { [Op.in]: ['IN_PROGRESS', 'PENDING'] } } });
            const completedInPeriod = await Objective.count({ where: { ...baseWhere, status: 'COMPLETED', updatedAt: { [Op.between]: [startDate, endDate] } }, });
            const quantitativeObjectives = await Objective.findAll({ where: { ...baseWhere, targetValue: { [Op.ne]: null } } });
            const averageProgress = quantitativeObjectives.length > 0 ? Math.round(quantitativeObjectives.reduce((sum, obj) => { const p = calculateProgressPercentage(obj.toJSON()); return sum + (isNaN(p) ? 0 : p); }, 0) / quantitativeObjectives.length) : 0;
            const categoriesRaw = await Objective.findAll({ attributes: [['tipo_objetivo', 'name'], [fn('COUNT', col('tipo_objetivo')), 'value']], where: baseWhere, group: ['tipo_objetivo'], raw: true, });
            const categoriesForSummary = categoriesRaw.map(cat => ({ name: cat.name, value: cat.value }));
            const trend = { type: 'neutral', textKey: 'analysis.trends.stable' };
            return { totalObjectives, activeObjectives, completedObjectives: completedInPeriod, averageProgress, categoryCount: categoriesForSummary.length, categories: categoriesForSummary, trend };
        } catch (error) {
            console.error("Error in getAnalysisSummary:", error);
            throw new AppError('Error al obtener las estadísticas de resumen del análisis.', 500, error);
        }
    }

    async getCategoryDistribution(userId, period = '3months') {
        return Objective.findAll({ attributes: [['tipo_objetivo', 'name'], [fn('COUNT', col('tipo_objetivo')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['tipo_objetivo'], raw: true, });
    }

    async getObjectiveStatusDistribution(userId, period = '3months') {
        return Objective.findAll({ attributes: [['estado', 'name'], [fn('COUNT', col('estado')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['estado'], raw: true, });
    }

    async getMonthlyProgress(userId, period = '3months') {
        // La función de cálculo en JS ya no es necesaria para este método
        const { startDate, endDate } = this._getDateRange(period);
        
        try {
            const months = [];
            let iterator = new Date(startDate);
            iterator.setDate(1);
            while (iterator <= endDate) {
                months.push({
                    year: iterator.getFullYear(),
                    month: iterator.getMonth() + 1,
                    // Clave para el resultado final
                    yearMonth: `${iterator.getFullYear()}-${String(iterator.getMonth() + 1).padStart(2, '0')}`,
                });
                iterator.setMonth(iterator.getMonth() + 1);
            }

            const monthlyProgressData = [];

            for (const monthInfo of months) {
                const { year, month, yearMonth } = monthInfo;

                // Consulta para obtener el último valor de progreso de cada objetivo al final del mes especificado.
                const subQuery = `
                    (SELECT p.valor_actual FROM progreso p
                     WHERE p.id_objetivo = Objective.id_objetivo
                       AND p.fecha_registro <= '${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}'
                     ORDER BY p.fecha_registro DESC, p.created_at DESC
                     LIMIT 1)
                `;

                const result = await Objective.findOne({
                    attributes: [
                        [
                            // AVG( (COALESCE(subQuery, valor_inicial_numerico) - valor_inicial_numerico) / (valor_cuantitativo - valor_inicial_numerico) * 100 )
                            fn('AVG', 
                                literal(`(
                                    (COALESCE(${subQuery}, \`Objective\`.\`valor_inicial_numerico\`) - \`Objective\`.\`valor_inicial_numerico\`) /
                                    (\`Objective\`.\`valor_cuantitativo\` - \`Objective\`.\`valor_inicial_numerico\`) * 100
                                )`)
                            ),
                            'averageProgress'
                        ]
                    ],
                    where: {
                        userId,
                        status: { [Op.not]: 'ARCHIVED' },
                        targetValue: { [Op.ne]: null },
                        // El objetivo debe haber sido creado antes de que el mes termine
                        createdAt: { [Op.lte]: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()} 23:59:59` },
                        // Asegurarse de que el denominador no sea cero
                        [Op.and]: [
                            literal('`Objective`.`valor_cuantitativo` != `Objective`.`valor_inicial_numerico`')
                        ]
                    },
                    raw: true,
                });
                
                monthlyProgressData.push({
                    monthYear: yearMonth,
                    averageProgress: Math.round(parseFloat(result.averageProgress) || 0)
                });
            }

            return monthlyProgressData;

        } catch (error) {
            console.error("Error fetching monthly progress:", error);
            throw new AppError('Error al obtener el progreso mensual.', 500, error);
        }
    }
   
    async getRankedObjectives(userId, period = '3months', limit = 5) {
        // --- CORRECCIÓN 2: Importar la función ---
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({
            where: { 
                userId, 
                status: { [Op.not]: 'ARCHIVED' }, 
                updatedAt: { [Op.between]: [startDate, endDate] },
                targetValue: { [Op.ne]: null }
            }
        });

        const objectivesWithProgress = objectives
            .map(objModel => {
                const obj = objModel.toJSON();
                return {
                    id: obj.id,
                    nombre: obj.name,
                    tipo_objetivo: obj.category,
                    progreso_calculado: calculateProgressPercentage(obj),
                };
            })
            .sort((a, b) => b.progreso_calculado - a.progreso_calculado);
        
        return { 
            top: objectivesWithProgress.slice(0, limit), 
            low: objectivesWithProgress.slice(-limit).reverse() 
        };
    }

    async getCategoryAverageProgress(userId, period = '3months') {
        // --- CORRECCIÓN 3: Importar la función ---
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({ where: { userId, updatedAt: { [Op.between]: [startDate, endDate] }, targetValue: { [Op.ne]: null }, category: { [Op.ne]: null }, status: { [Op.not]: 'ARCHIVED' } } });
        const progressByCategory = {};
        objectives.forEach(obj => {
            const objectiveJson = obj.toJSON();
            if (!objectiveJson.category) return; 
            if (!progressByCategory[objectiveJson.category]) { 
                progressByCategory[objectiveJson.category] = { totalProgress: 0, count: 0 }; 
            }
            const progress = calculateProgressPercentage(objectiveJson);
            if (!isNaN(progress)) {
                progressByCategory[objectiveJson.category].totalProgress += progress;
                progressByCategory[objectiveJson.category].count++;
            }
        });
        return Object.entries(progressByCategory).map(([categoryName, data]) => ({ 
            categoryName, 
            averageProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0 
        }));
    }

    async getDetailedObjectivesByCategory(userId, period = '3months') {
        // --- CORRECCIÓN 4: Importar la función ---
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({
            where: {
                userId,
                category: { [Op.ne]: null },
                updatedAt: { [Op.between]: [startDate, endDate] },
                status: { [Op.not]: 'ARCHIVED' }
            },
        });

        const groupedByCategory = objectives.reduce((acc, obj) => {
            const objectiveJson = obj.toJSON();
            const categoryName = objectiveJson.category;
            if (!acc[categoryName]) {
                acc[categoryName] = { categoryName, objectiveCount: 0, objectives: [] };
            }
            acc[categoryName].objectiveCount++;
            
            acc[categoryName].objectives.push({
                id: objectiveJson.id,
                nombre: objectiveJson.name,
                progreso_calculado: calculateProgressPercentage(objectiveJson),
                valor_actual: objectiveJson.currentValue,
                valor_cuantitativo: objectiveJson.targetValue,
                unidad_medida: objectiveJson.unit,
            });
            return acc;
        }, {});

        return Object.values(groupedByCategory);
    }

    async getObjectivesProgressChartData(userId, period = '3months') {
        // --- CORRECCIÓN 5: Importar la función ---
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({
            where: {
                userId,
                status: { [Op.in]: ['IN_PROGRESS', 'PENDING'] },
                targetValue: { [Op.ne]: null },
                updatedAt: { [Op.between]: [startDate, endDate] }
            }
        });

        return objectives.map(obj => {
            const objectiveJson = obj.toJSON();
            return {
                id: objectiveJson.id,
                name: objectiveJson.name,
                progressPercentage: calculateProgressPercentage(objectiveJson),
                category: objectiveJson.category
            };
        });
    }
}

module.exports = new AnalysisService();