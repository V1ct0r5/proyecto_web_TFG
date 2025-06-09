// backend/src/api/services/dashboardService.js
const { Op, fn, col } = require('sequelize');
const db = require('../../config/database');
const { Objetivo, Progress, ActivityLog } = db.sequelize.models;
const AppError = require('../../utils/AppError');


exports.calculateSummaryStats = async (userId) => {
    if (!userId) {
        throw new AppError('ID de usuario no fue proporcionado al servicio de cálculo de estadísticas.', 500);
    }

    // --- CORRECCIÓN: Contar solo los objetivos que NO están archivados ---
    const totalObjectives = await Objetivo.count({ 
        where: { 
            id_usuario: userId,
            estado: { [Op.not]: 'Archivado' }
        } 
    });

    const statusCountsResult = await Objetivo.findAll({
        attributes: ['estado', [fn('COUNT', col('estado')), 'count']],
        // --- CORRECCIÓN: Contar solo los estados de objetivos no archivados ---
        where: { 
            id_usuario: userId,
            estado: { [Op.not]: 'Archivado' }
        },
        group: ['estado'],
        raw: true,
    });
    const statusCounts = statusCountsResult.reduce((acc, item) => {
        acc[item.estado] = parseInt(item.count, 10);
        return acc;
    }, {});

    // El cálculo del progreso promedio ya excluía correctamente los archivados, se mantiene.
    const activeQuantitativeObjectives = await Objetivo.findAll({
        where: {
            id_usuario: userId,
            estado: { [Op.in]: ['En progreso', 'Pendiente', 'No Iniciados'] },
            valor_cuantitativo: { [Op.ne]: null },
            valor_inicial_numerico: { [Op.ne]: null }
        },
    });

    let averageProgress = 0;
    if (activeQuantitativeObjectives.length > 0) {
        const totalProgressSum = activeQuantitativeObjectives.reduce((sum, obj) => {
            const initial = parseFloat(obj.valor_inicial_numerico);
            const current = parseFloat(obj.valor_actual);
            const target = parseFloat(obj.valor_cuantitativo);
            let progress = 0;
            if (!isNaN(initial) && !isNaN(current) && !isNaN(target)) {
                if (obj.es_menor_mejor) {
                    const range = initial - target;
                    progress = range <= 0 ? (current <= target ? 100 : 0) : Math.max(0, ((initial - current) / range) * 100);
                } else {
                    const range = target - initial;
                    progress = range <= 0 ? (current >= target ? 100 : 0) : Math.max(0, ((current - initial) / range) * 100);
                }
                progress = Math.min(100, Math.round(progress));
            }
            return sum + progress;
        }, 0);
        averageProgress = Math.round(totalProgressSum / activeQuantitativeObjectives.length);
    }

    // El conteo de objetivos próximos a vencer ya excluía correctamente los archivados.
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueSoonCount = await Objetivo.count({
        where: {
            id_usuario: userId,
            fecha_fin: { [Op.ne]: null, [Op.lte]: sevenDaysFromNow, [Op.gte]: new Date() },
            estado: { [Op.notIn]: ['Completado', 'Archivado', 'Fallido'] }
        }
    });

    const categoryDistributionResult = await Objetivo.findAll({
        attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'count']],
        // --- CORRECCIÓN: Excluir archivados del gráfico de categorías ---
        where: { 
            id_usuario: userId,
            estado: { [Op.not]: 'Archivado' }
        },
        group: ['tipo_objetivo'],
        raw: true,
    });
    const categoryDistribution = categoryDistributionResult.map(item => ({
        name: item.tipo_objetivo,
        value: parseInt(item.count, 10)
    }));

    return {
        totalObjectives,
        statusCounts,
        averageProgress,
        dueSoonCount,
        categoryDistribution,
    };
};

exports.fetchRecentObjectives = async (userId, limit) => {
    const objectives = await Objetivo.findAll({
        // --- CORRECCIÓN: Excluir archivados de la lista de recientes ---
        where: { 
            id_usuario: userId,
            estado: { [Op.not]: 'Archivado' }
        },
        order: [['updatedAt', 'DESC']],
        limit: limit,
        attributes: ['id_objetivo', 'nombre', 'estado', 'updatedAt', 'valor_actual', 'valor_cuantitativo', 'valor_inicial_numerico', 'es_menor_mejor'],
    });

    // El cálculo del progreso para cada objetivo es correcto
    return objectives.map(obj => {
        let progressPercentage = 0;
        const initial = parseFloat(obj.valor_inicial_numerico);
        const current = parseFloat(obj.valor_actual);
        const target = parseFloat(obj.valor_cuantitativo);
        if (!isNaN(initial) && !isNaN(current) && !isNaN(target)) {
            if (obj.es_menor_mejor) {
                const range = initial - target;
                progressPercentage = range <= 0 ? (current <= target ? 100 : 0) : ((initial - current) / range) * 100;
            } else {
                const range = target - initial;
                progressPercentage = range <= 0 ? (current >= target ? 100 : 0) : ((current - initial) / range) * 100;
            }
            progressPercentage = Math.max(0, Math.min(100, Math.round(progressPercentage)));
        }
        return {
            id_objetivo: obj.id_objetivo,
            nombre: obj.nombre,
            estado: obj.estado,
            updatedAt: obj.updatedAt,
            progreso_calculado: progressPercentage,
        };
    });
};

// --- SIN CAMBIOS AQUÍ ---
// La actividad reciente SÍ debe mostrar el log de "Objetivo archivado",
// por lo que esta función no debe filtrar por estado.
exports.fetchRecentActivities = async (userId, limit) => {
    try {
        const activities = await ActivityLog.findAll({
            where: { id_usuario: userId },
            order: [['createdAt', 'DESC']],
            limit: limit
        });
        return activities;
    } catch (error) {
        console.error('Error en fetchRecentActivities (servicio):', error);
        throw new AppError('Error al obtener la actividad reciente.', 500, error);
    }
};