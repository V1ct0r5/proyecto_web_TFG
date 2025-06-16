// backend/src/api/services/analysisService.js
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
        const { calculateProgressPercentage } = require('./objectivesService');
        const { startDate, endDate } = this._getDateRange(period);
        
        try {
            // 1. Obtener todos los datos necesarios en dos consultas limpias
            const objectives = await Objective.findAll({
                where: {
                    userId,
                    targetValue: { [Op.ne]: null },
                    status: { [Op.not]: 'ARCHIVED' },
                    createdAt: { [Op.lte]: endDate }
                },
                raw: true
            });

            if (objectives.length === 0) {
                return [];
            }

            const objectiveIds = objectives.map(o => o.id_objetivo);
            const allProgressEntries = await Progress.findAll({
                where: { objectiveId: { [Op.in]: objectiveIds } },
                attributes: ['id_objetivo', 'fecha_registro', 'valor_actual'],
                raw: true
            });

            // 2. Agrupar las entradas de progreso por ID para un acceso eficiente
            const progressByObjective = allProgressEntries.reduce((acc, entry) => {
                const id = entry.id_objetivo;
                if (!acc[id]) acc[id] = [];
                // `new Date('YYYY-MM-DD')` crea la fecha en UTC, lo cual es seguro.
                acc[id].push({ date: new Date(entry.fecha_registro), value: entry.valor_actual });
                return acc;
            }, {});

            // 3. Preparar la estructura de datos para los resultados mensuales
            const monthlyData = {};
            let iterator = new Date(startDate);
            iterator.setDate(1);
            while (iterator <= endDate) {
                const yearMonth = `${iterator.getFullYear()}-${String(iterator.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[yearMonth] = [];
                iterator.setMonth(iterator.getMonth() + 1);
            }

            // 4. Procesar cada objetivo y su contribución a cada mes
            objectives.forEach(obj => {
                // Construir un historial completo para este objetivo
                const history = [{ date: new Date(obj.created_at), value: obj.valor_inicial_numerico }];
                if (progressByObjective[obj.id_objetivo]) {
                    history.push(...progressByObjective[obj.id_objetivo]);
                }
                
                // Ordenar el historial cronológicamente
                history.sort((a, b) => a.date - b.date);

                // Iterar sobre cada mes y encontrar el valor del objetivo al final de ese mes
                for (const yearMonth in monthlyData) {
                    const year = parseInt(yearMonth.split('-')[0]);
                    const month = parseInt(yearMonth.split('-')[1]);
                    // Forma 100% segura de obtener el último día del mes
                    // new Date(year, month, 0) es el último día del mes ANTERIOR. 
                    // Como los meses en JS son 0-indexed, `month` es correcto.
                    const monthEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

                    if (new Date(obj.created_at) > monthEndDate) {
                        continue;
                    }

                    const relevantHistory = history.filter(h => h.date <= monthEndDate);
                    
                    if (relevantHistory.length > 0) {
                        const latestValue = relevantHistory[relevantHistory.length - 1].value;
                        
                        const progress = calculateProgressPercentage({
                            initialValue: obj.valor_inicial_numerico,
                            targetValue: obj.valor_cuantitativo,
                            isLowerBetter: obj.es_menor_mejor,
                            currentValue: latestValue,
                        });
                        
                        if (!isNaN(progress)) {
                            monthlyData[yearMonth].push(progress);
                        }
                    }
                }
            });

            // 5. Calcular el promedio final para cada mes
            return Object.keys(monthlyData).sort().map(yearMonth => {
                const progresses = monthlyData[yearMonth];
                const average = progresses.length > 0
                    ? Math.round(progresses.reduce((sum, p) => sum + p, 0) / progresses.length)
                    : 0;
                return { monthYear: yearMonth, averageProgress: average };
            });

        } catch (error) {
            console.error("Error fetching monthly progress:", error);
            throw new AppError('Error al obtener el progreso mensual.', 500, error);
        }
    }
   
    
    async getRankedObjectives(userId, period = '3months', limit = 5) {
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