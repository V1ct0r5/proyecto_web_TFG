// backend/src/api/services/dashboardService.js
const { Op, fn, col } = require('sequelize');
const db = require('../../config/database');
const { Objective, ActivityLog } = db;
const AppError = require('../../utils/AppError');
const { calculateProgressPercentage } = require('./objectivesService');

class DashboardService {

    async calculateSummaryStats(userId) {
        if (!userId) {
            throw new AppError('ID de usuario no proporcionado.', 500);
        }

        const baseWhere = { userId, status: { [Op.not]: 'ARCHIVED' } };

        const totalObjectives = await Objective.count({ where: { userId, status: { [Op.not]: 'ARCHIVED' } } });

        const statusCountsResult = await Objective.findAll({
            attributes: [
                ['estado', 'status'], // Selecciona la columna 'estado', la nombra 'status'
                [fn('COUNT', col('estado')), 'count']
            ],
            where: { userId, status: { [Op.not]: 'ARCHIVED' } },
            group: [col('estado')], // Agrupa por la columna real 'estado'
            raw: true,
        });
        const statusCounts = statusCountsResult.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count, 10);
            return acc;
        }, {});

        const quantitativeObjectives = await Objective.findAll({
            where: { ...baseWhere, targetValue: { [Op.ne]: null } },
        });

        let averageProgress = 0;
        if (quantitativeObjectives.length > 0) {
            const totalProgress = quantitativeObjectives.reduce((sum, obj) => {
                return sum + calculateProgressPercentage(obj.toJSON());
            }, 0);
            averageProgress = Math.round(totalProgress / quantitativeObjectives.length);
        }

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const dueSoonCount = await Objective.count({
            where: {
                userId,
                endDate: { [Op.ne]: null, [Op.between]: [new Date(), sevenDaysFromNow] },
                status: { [Op.notIn]: ['COMPLETED', 'ARCHIVED', 'FAILED'] }
            }
        });
        
        // --- ESTA ES LA PARTE CORREGIDA PARA EL ERROR ACTUAL ---
        const categories = await Objective.findAll({
            attributes: [
                ['tipo_objetivo', 'category'], // Selecciona la columna 'tipo_objetivo', la nombra 'category'
                [fn('COUNT', col('tipo_objetivo')), 'count']
            ],
            where: baseWhere,
            group: [col('tipo_objetivo')], // Agrupa por la columna real 'tipo_objetivo'
            raw: true,
        });

        return { totalObjectives, statusCounts, averageProgress, dueSoonCount, categories };
    }

    async fetchRecentObjectives(userId, limit) {
        const numericLimit = parseInt(limit, 10) || 4;
        const objectives = await Objective.findAll({
            where: { userId, status: { [Op.not]: 'ARCHIVED' } },
            order: [['updatedAt', 'DESC']],
            limit: numericLimit,
        });

        return objectives.map(obj => {
            const objectiveJson = obj.toJSON();
            const progressPercentage = calculateProgressPercentage(objectiveJson);
            return {
                id: objectiveJson.id,
                name: objectiveJson.name,
                status: objectiveJson.status,
                updatedAt: objectiveJson.updatedAt,
                progressPercentage: progressPercentage,
            };
        });
    }

    async fetchRecentActivities(userId, limit) {
        const numericLimit = parseInt(limit, 10) || 5;
        return ActivityLog.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: numericLimit,
            include: [{ model: Objective, as: 'objective', attributes: ['name']}]
        });
    }
}

module.exports = new DashboardService();