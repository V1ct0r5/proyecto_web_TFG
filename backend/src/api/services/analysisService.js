const { Op, fn, col } = require('sequelize');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');
const { calculateProgressPercentage } = require('./objectivesService'); 

const { Objective, Progress } = db;

const CATEGORY_COLORS = {
    HEALTH: { border: 'rgba(255, 99, 132, 1)', bg: 'rgba(255, 99, 132, 0.2)' },
    FINANCE: { border: 'rgba(75, 192, 192, 1)', bg: 'rgba(75, 192, 192, 0.2)' },
    PERSONAL_DEV: { border: 'rgba(255, 206, 86, 1)', bg: 'rgba(255, 206, 86, 0.2)' },
    RELATIONSHIPS: { border: 'rgba(255, 159, 64, 1)', bg: 'rgba(255, 159, 64, 0.2)' },
    CAREER: { border: 'rgba(54, 162, 235, 1)', bg: 'rgba(54, 162, 235, 0.2)' },
    OTHER: { border: 'rgba(153, 102, 255, 1)', bg: 'rgba(153, 102, 255, 0.2)' },
    default: { border: 'rgba(201, 203, 207, 1)', bg: 'rgba(201, 203, 207, 0.2)' },
};

class AnalysisService {
    _getDateRange(period) {
        const endDate = new Date();
        let startDate = new Date();
        if (period === 'all') {
            const fiveMonthsAgo = new Date();
            fiveMonthsAgo.setMonth(endDate.getMonth() - 5);
            startDate = fiveMonthsAgo;
        } else {
            const monthsToSubtract = { '1month': 1, '3months': 3, '6months': 6, '1year': 12 }[period] || 3;
            startDate.setMonth(endDate.getMonth() - (monthsToSubtract - 1));
        }
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
    }
    
    async getMonthlyProgress(userId, period = '3months') {
        const { startDate, endDate } = this._getDateRange(period);
        try {
            const objectives = await Objective.findAll({
                where: {
                    userId,
                    status: { [Op.not]: 'ARCHIVED' },
                    targetValue: { [Op.ne]: null },
                    createdAt: { [Op.lte]: endDate },
                },
                include: [{
                    model: Progress,
                    as: 'progressEntries',
                    where: { entryDate: { [Op.lte]: endDate } },
                    required: false,
                    // Añadimos 'id' como segundo criterio para desempates en el mismo día.
                    order: [['entryDate', 'DESC'], ['id', 'DESC']],
                }],
            });

            if (objectives.length === 0) {
                return { labels: [], datasets: [] };
            }

            const objectivesByCategory = objectives.reduce((acc, obj) => {
                const category = obj.category || 'OTHER';
                if (!acc[category]) acc[category] = [];
                acc[category].push(obj.toJSON());
                return acc;
            }, {});

            const labels = [];
            const monthLocale = 'es-ES';
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                labels.push(
                    currentDate.toLocaleDateString(monthLocale, { month: 'long', year: 'numeric' })
                    .replace(/^\w/, c => c.toUpperCase())
                );
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            const datasets = Object.entries(objectivesByCategory).map(([category, categoryObjectives]) => {
                const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
                
                let monthIterator = new Date(startDate);
                const dataPoints = labels.map(() => {
                    const endOfMonth = new Date(monthIterator.getFullYear(), monthIterator.getMonth() + 1, 0, 23, 59, 59);
                    
                    const activeObjectivesInMonth = categoryObjectives.filter(obj => new Date(obj.createdAt) <= endOfMonth);

                    if (activeObjectivesInMonth.length === 0) {
                        monthIterator.setMonth(monthIterator.getMonth() + 1);
                        return null; 
                    }

                    const progressesForMonth = activeObjectivesInMonth.map(obj => {
                        const entries = obj.progressEntries || [];
                        const validEntries = entries.filter(p => new Date(p.entryDate) <= endOfMonth);
                        const latestEntry = validEntries[0]; // Tomamos el primero
                        
                        const progressValue = latestEntry ? latestEntry.value : obj.initialValue;
                        return calculateProgressPercentage({ ...obj, currentValue: progressValue });
                    });

                    monthIterator.setMonth(monthIterator.getMonth() + 1);
                    const totalProgress = progressesForMonth.reduce((sum, p) => sum + p, 0);
                    return Math.round(totalProgress / progressesForMonth.length);
                });

                for (let i = 1; i < dataPoints.length; i++) {
                    if (dataPoints[i] === null) dataPoints[i] = dataPoints[i - 1];
                }
                if (dataPoints[0] === null) dataPoints[0] = 0;


                return {
                    label: category,
                    data: dataPoints.map(p => p === null ? 0 : p),
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                    fill: true,
                    tension: 0.3,
                };
            });
            
            return { labels, datasets };

        } catch (error) {
            console.error("Error fetching monthly progress by category:", error);
            throw new AppError('Error al obtener el progreso mensual por categoría.', 500, error);
        }
    }


    async getAnalysisSummary(userId, period = '3months') {
        try {
            const { startDate, endDate } = this._getDateRange(period);
            const wherePeriod = startDate.getFullYear() > 1970 ? { updatedAt: { [Op.between]: [startDate, endDate] } } : {};

            const [
                totalObjectives, activeObjectives, completedInPeriod, quantitativeObjectives, categoriesRaw
            ] = await Promise.all([
                Objective.count({ where: { userId } }),
                Objective.count({ where: { userId, status: { [Op.in]: ['IN_PROGRESS', 'PENDING'] } } }),
                Objective.count({ where: { userId, status: 'COMPLETED', ...wherePeriod } }),
                Objective.findAll({ where: { userId, status: { [Op.not]: 'ARCHIVED' }, targetValue: { [Op.ne]: null } } }),
                Objective.findAll({ attributes: [['tipo_objetivo', 'name'], [fn('COUNT', col('tipo_objetivo')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['tipo_objetivo'], raw: true }),
            ]);

            const averageProgress = quantitativeObjectives.length > 0 ? Math.round(quantitativeObjectives.reduce((sum, obj) => sum + calculateProgressPercentage(obj.toJSON()), 0) / quantitativeObjectives.length) : 0;
            
            let trend;
            if (completedInPeriod >= 2) {
                trend = { type: 'up', textKey: 'analysis.trends.improving' };
            } else if (completedInPeriod === 0) {
                 const failedInPeriod = await Objective.count({ where: { userId, status: 'FAILED', ...wherePeriod }});
                 if (failedInPeriod >= 2) {
                     trend = { type: 'down', textKey: 'analysis.trends.declining' };
                 } else {
                     trend = { type: 'neutral', textKey: 'analysis.trends.stable' };
                 }
            } else {
                trend = { type: 'neutral', textKey: 'analysis.trends.stable' };
            }
            
            const categoriesForSummary = categoriesRaw.map(cat => ({ name: cat.name, value: cat.value }));

            return { totalObjectives, activeObjectives, completedObjectives: completedInPeriod, averageProgress, categoryCount: categoriesForSummary.length, categories: categoriesForSummary, trend };
        } catch (error) {
            console.error("Error in getAnalysisSummary:", error);
            throw new AppError('Error al obtener las estadísticas de resumen del análisis.', 500, error);
        }
    }

    async getCategoryDistribution(userId) {
        return Objective.findAll({ attributes: [['tipo_objetivo', 'name'], [fn('COUNT', col('tipo_objetivo')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['tipo_objetivo'], raw: true, });
    }

    async getObjectiveStatusDistribution(userId) {
        return Objective.findAll({ attributes: [['estado', 'name'], [fn('COUNT', col('estado')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['estado'], raw: true, });
    }
   
    async getRankedObjectives(userId, period = '3months', limit = 5) {
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({ where: { userId, status: { [Op.not]: 'ARCHIVED' }, updatedAt: { [Op.between]: [startDate, endDate] }, targetValue: { [Op.ne]: null } } });
        const objectivesWithProgress = objectives.map(objModel => {
            const obj = objModel.toJSON();
            return { id: obj.id, nombre: obj.name, tipo_objetivo: obj.category, progreso_calculado: calculateProgressPercentage(obj) };
        }).sort((a, b) => b.progreso_calculado - a.progreso_calculado);
        
        return { top: objectivesWithProgress.slice(0, limit), low: objectivesWithProgress.slice(-limit).reverse() };
    }

    async getCategoryAverageProgress(userId, period = '3months') {
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({ where: { userId, updatedAt: { [Op.between]: [startDate, endDate] }, targetValue: { [Op.ne]: null }, category: { [Op.ne]: null }, status: { [Op.not]: 'ARCHIVED' } } });
        const progressByCategory = {};
        objectives.forEach(obj => {
            const objectiveJson = obj.toJSON();
            if (!objectiveJson.category) return; 
            if (!progressByCategory[objectiveJson.category]) { progressByCategory[objectiveJson.category] = { totalProgress: 0, count: 0 }; }
            const progress = calculateProgressPercentage(objectiveJson);
            if (!isNaN(progress)) {
                progressByCategory[objectiveJson.category].totalProgress += progress;
                progressByCategory[objectiveJson.category].count++;
            }
        });
        return Object.entries(progressByCategory).map(([categoryName, data]) => ({ categoryName, averageProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0 }));
    }

    async getDetailedObjectivesByCategory(userId, period = '3months') {
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({ where: { userId, category: { [Op.ne]: null }, updatedAt: { [Op.between]: [startDate, endDate] }, status: { [Op.not]: 'ARCHIVED' } }, });

        const groupedByCategory = objectives.reduce((acc, obj) => {
            const objectiveJson = obj.toJSON();
            const categoryName = objectiveJson.category;
            if (!acc[categoryName]) { acc[categoryName] = { categoryName, objectiveCount: 0, objectives: [] }; }
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
        const objectives = await Objective.findAll({ where: { userId, status: { [Op.in]: ['IN_PROGRESS', 'PENDING'] }, targetValue: { [Op.ne]: null }, updatedAt: { [Op.between]: [startDate, endDate] } } });

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