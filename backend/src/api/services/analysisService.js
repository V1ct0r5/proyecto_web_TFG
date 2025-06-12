// backend/src/api/services/analysisService.js
const { Op, fn, col, literal } = require('sequelize');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');

const { Objective, Progress } = db;
const { calculateProgressPercentage } = require('./objectivesService');

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
        const { startDate, endDate } = this._getDateRange(period);
        try {
            // PASO 1: Obtener objetivos cuantitativos relevantes (sin el include).
            const objectives = await Objective.findAll({
                where: {
                    userId,
                    targetValue: { [Op.ne]: null },
                    status: { [Op.not]: 'ARCHIVED' },
                    createdAt: { [Op.lte]: endDate }
                },
                raw: true // Usar raw: true para obtener objetos planos y más eficientes.
            });

            if (objectives.length === 0) {
                return []; // No hay objetivos, no hay nada que calcular.
            }

            // PASO 2: Obtener todas las entradas de progreso para esos objetivos en una sola consulta.
            const objectiveIds = objectives.map(o => o.id);
            const progressEntries = await Progress.findAll({
                where: { objectiveId: { [Op.in]: objectiveIds } },
                attributes: ['objectiveId', 'entryDate', 'value'],
                raw: true
            });

            // PASO 3: Agrupar las entradas de progreso por ID de objetivo para un acceso rápido.
            const progressByObjective = progressEntries.reduce((acc, entry) => {
                const id = entry.objectiveId;
                if (!acc[id]) { acc[id] = []; }
                acc[id].push(entry);
                return acc;
            }, {});

            // Asignar manualmente las entradas de progreso a cada objetivo.
            objectives.forEach(obj => {
                obj.progressEntries = progressByObjective[obj.id] || [];
            });

            const monthlyData = {};
            const currentDateIterator = new Date(startDate);
            currentDateIterator.setDate(1);

            while (currentDateIterator <= endDate) {
                const yearMonth = `${currentDateIterator.getFullYear()}-${(currentDateIterator.getMonth() + 1).toString().padStart(2, '0')}`;
                monthlyData[yearMonth] = { totalProgress: 0, count: 0 };
                currentDateIterator.setMonth(currentDateIterator.getMonth() + 1);
            }

            for (const yearMonth in monthlyData) {
                const monthEndDate = new Date(yearMonth);
                monthEndDate.setMonth(monthEndDate.getMonth() + 1, 0);
                monthEndDate.setHours(23, 59, 59, 999);

                objectives.forEach(obj => {
                    if (new Date(obj.createdAt) > monthEndDate) {
                        return;
                    }

                    const dataPoints = [];
                    dataPoints.push({ date: new Date(obj.createdAt), value: obj.initialValue });
                    (obj.progressEntries || []).forEach(entry => {
                        const entryDate = new Date(entry.entryDate);
                        if (!isNaN(entryDate.getTime())) {
                            dataPoints.push({ date: entryDate, value: entry.value });
                        }
                    });
                    
                    const relevantPoints = dataPoints.filter(dp => dp.date <= monthEndDate);
                    if (relevantPoints.length === 0) {
                        return;
                    }

                    relevantPoints.sort((a, b) => b.date - a.date);
                    const latestValue = relevantPoints[0].value;

                    const progress = calculateProgressPercentage({
                        ...obj,
                        currentValue: latestValue
                    });
                    
                    if (!isNaN(progress)) {
                        monthlyData[yearMonth].totalProgress += progress;
                        monthlyData[yearMonth].count++;
                    }
                });
            }

            return Object.keys(monthlyData).sort().map(yearMonth => {
                const data = monthlyData[yearMonth];
                const averageProgress = data.count > 0 ? Math.round(data.totalProgress / data.count) : 0;
                return {
                    monthYear: yearMonth,
                    averageProgress: averageProgress,
                };
            });

        } catch (error) {
            console.error("Error fetching monthly progress:", error);
            throw new AppError('Error al obtener el progreso mensual.', 500, error);
        }
    }
    
    async getRankedObjectives(userId, period = '3months', limit = 5) {
        const { startDate, endDate } = this._getDateRange(period);
        // Mantenemos el filtro para asegurar que solo se procesan objetivos cuantitativos.
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
                // **AQUÍ LA CORRECCIÓN CLAVE**: Creamos un objeto con los nombres que el frontend espera.
                return {
                    id: obj.id,
                    nombre: obj.name,
                    tipo_objetivo: obj.category,
                    progreso_calculado: calculateProgressPercentage(obj),
                    // Añadimos 'color' aquí para que el frontend no tenga que calcularlo
                    // Esta es una mejora opcional pero recomendada.
                };
            })
            // Ordenamos por la propiedad correcta.
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
            if (!obj.category) return; 
            if (!progressByCategory[obj.category]) { progressByCategory[obj.category] = { totalProgress: 0, count: 0 }; }
            const progress = calculateProgressPercentage(obj.toJSON());
            if (!isNaN(progress)) {
                progressByCategory[obj.category].totalProgress += progress;
                progressByCategory[obj.category].count++;
            }
        });
        return Object.entries(progressByCategory).map(([categoryName, data]) => ({ categoryName, averageProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0 }));
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