const { Op, fn, col, literal } = require('sequelize');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');
const { calculateProgressPercentage } = require('./objectivesService'); 

const { Objective, Progress } = db;

class AnalysisService {
    _getDateRange(period) {
        const endDate = new Date();
        let startDate = new Date(endDate); // Clonamos para no modificar la misma instancia

        if (period === 'all') {
            return { startDate: new Date(0), endDate };
        }
        
        const monthsToSubtract = {
            '1month': 1,
            '3months': 3,
            '6months': 6,
            '1year': 12
        }[period] || 3;

        startDate.setMonth(startDate.getMonth() - monthsToSubtract + 1, 1);

        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        return { startDate, endDate };
    }

    async getAnalysisSummary(userId, period = '3months') {
        try {
            const { startDate, endDate } = this._getDateRange(period);
            const wherePeriod = startDate.getFullYear() > 1970 ? { updatedAt: { [Op.between]: [startDate, endDate] } } : {};

            const [
                totalObjectives,
                activeObjectives,
                completedInPeriod,
                quantitativeObjectives,
                categoriesRaw
            ] = await Promise.all([
                Objective.count({ where: { userId } }),
                Objective.count({ where: { userId, status: { [Op.in]: ['IN_PROGRESS', 'PENDING'] } } }),
                Objective.count({ where: { userId, status: 'COMPLETED', ...wherePeriod } }),
                Objective.findAll({ where: { userId, status: { [Op.not]: 'ARCHIVED' }, targetValue: { [Op.ne]: null } } }),
                Objective.findAll({ attributes: [['tipo_objetivo', 'name'], [fn('COUNT', col('tipo_objetivo')), 'value']], where: { userId, status: { [Op.not]: 'ARCHIVED' } }, group: ['tipo_objetivo'], raw: true }),
            ]);

            const averageProgress = quantitativeObjectives.length > 0
                ? Math.round(quantitativeObjectives.reduce((sum, obj) => {
                    const p = calculateProgressPercentage(obj.toJSON());
                    return sum + (isNaN(p) ? 0 : p);
                }, 0) / quantitativeObjectives.length)
                : 0;
            
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

    async getMonthlyProgress(userId, period = '3months') {
        const { startDate, endDate } = this._getDateRange(period);
        try {
            const objectives = await Objective.findAll({
                where: { userId, status: { [Op.not]: 'ARCHIVED' }, targetValue: { [Op.ne]: null }, createdAt: { [Op.lte]: endDate } },
                include: [{ model: Progress, as: 'progressEntries', where: { entryDate: { [Op.lte]: endDate } }, required: false }]
            });
    
            if (objectives.length === 0) return [];
    
            const monthlyProgressData = [];
            let currentDate = new Date(startDate);
    
            while (currentDate.getTime() <= endDate.getTime()) {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
                const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    
                const progressesForMonth = objectives
                    .filter(obj => new Date(obj.createdAt) <= endOfMonth)
                    .map(obj => {
                        const objData = obj.toJSON();
                        
                        const relevantEntries = (objData.progressEntries || [])
                            .filter(p => new Date(p.entryDate) <= endOfMonth)
                            .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
                        
                        objData.currentValue = relevantEntries.length > 0 ? relevantEntries[0].value : objData.initialValue;
                        return calculateProgressPercentage(objData);
                    });
                
                const validProgresses = progressesForMonth.filter(p => !isNaN(p));
                const totalProgress = validProgresses.reduce((sum, p) => sum + p, 0);
                const averageProgress = validProgresses.length > 0 ? Math.round(totalProgress / validProgresses.length) : 0;
                
                monthlyProgressData.push({ monthYear: yearMonth, averageProgress });
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
    
            return monthlyProgressData;
        } catch (error) {
            console.error("Error fetching monthly progress:", error);
            throw new AppError('Error al obtener el progreso mensual.', 500, error);
        }
    }
   
    async getRankedObjectives(userId, period = '3months', limit = 5) {
        const { startDate, endDate } = this._getDateRange(period);
        const objectives = await Objective.findAll({ where: { userId, status: { [Op.not]: 'ARCHIVED' }, updatedAt: { [Op.between]: [startDate, endDate] }, targetValue: { [Op.ne]: null } } });
        const objectivesWithProgress = objectives.map(objModel => {
            const obj = objModel.toJSON();
            return {
                id: obj.id,
                nombre: obj.name,
                tipo_objetivo: obj.category,
                progreso_calculado: calculateProgressPercentage(obj),
            };
        }).sort((a, b) => b.progreso_calculado - a.progreso_calculado);
        
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