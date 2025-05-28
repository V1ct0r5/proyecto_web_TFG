const { Op, fn, col } = require('sequelize'); // Importa fn y col directamente de la librería sequelize
const db = require('../../config/database');    // Importa tu objeto db principal
const { Objetivo, Progress, User } = db.sequelize.models; // Obtén los modelos así

exports.calculateSummaryStats = async (userId) => {
    console.log('Dashboard Service - calculateSummaryStats - userId:', userId);
    if (!userId) {
        console.error('Dashboard Service - userId es undefined o null en calculateSummaryStats');
        throw new AppError('ID de usuario no proporcionado al servicio de dashboard.', 500);
    }

    const totalObjectives = await Objetivo.count({ where: { id_usuario: userId } });

    const statusCountsResult = await Objetivo.findAll({
        attributes: ['estado', [fn('COUNT', col('estado')), 'count']], // Usa fn() y col() directamente
        where: { id_usuario: userId },
        group: ['estado'],
        raw: true,
    });
    const statusCounts = statusCountsResult.reduce((acc, item) => {
        acc[item.estado] = parseInt(item.count, 10);
        return acc;
    }, {});

    const activeQuantitativeObjectives = await Objetivo.findAll({
        where: {
            id_usuario: userId,
            estado: { [Op.in]: ['En progreso', 'Pendiente'] },
            valor_cuantitativo: { [Op.ne]: null },
            valor_inicial_numerico: { [Op.ne]: null }
        },
    });

    let averageProgress = 0; // Declarar e inicializar

    if (activeQuantitativeObjectives.length > 0) {
        const totalProgressSum = activeQuantitativeObjectives.reduce((sum, obj) => {
            const initial = parseFloat(obj.valor_inicial_numerico);
            const current = parseFloat(obj.valor_actual);
            const target = parseFloat(obj.valor_cuantitativo);
            let progress = 0;
            if (!isNaN(initial) && !isNaN(current) && !isNaN(target)) {
                if (obj.es_menor_mejor) {
                    if (initial <= target) progress = (current <= target) ? 100 : 0;
                    else {
                        const range = initial - target;
                        progress = range <= 0 ? 100 : ((initial - current) / range) * 100;
                    }
                } else {
                    if (initial >= target) progress = (current >= target) ? 100 : 0;
                    else {
                        const range = target - initial;
                        progress = range <= 0 ? 100 : ((current - initial) / range) * 100;
                    }
                }
                progress = Math.max(0, Math.min(100, Math.round(progress)));
            }
            return sum + progress;
        }, 0);
        averageProgress = Math.round(totalProgressSum / activeQuantitativeObjectives.length);
    }
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueSoonCount = await Objetivo.count({
        where: {
            id_usuario: userId,
            fecha_fin: {
                [Op.ne]: null,
                [Op.lte]: sevenDaysFromNow,
                [Op.gte]: new Date()
            },
            estado: { [Op.notIn]: ['Completado', 'Archivado', 'Fallido'] }
        }
    });

    const categoryDistributionResult = await Objetivo.findAll({
        attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'count']], // Usa fn() y col() directamente
        where: { id_usuario: userId },
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
        averageProgress, // Asegúrate que este cálculo esté correcto o simplifícalo temporalmente
        dueSoonCount,
        categoryDistribution,
    };
};

exports.fetchRecentObjectives = async (userId, limit) => {
    return await Objetivo.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']], // O 'createdAt' si prefieres los más nuevos
        limit: limit,
        attributes: ['id_objetivo', 'nombre', 'estado', 'updatedAt', /* 'progreso_calculado' - este se calcula en el frontend o aquí */],
    });
    // Para 'progreso_calculado', necesitarías mapear y calcularlo aquí o dejar que el frontend lo haga.
};

exports.fetchRecentActivities = async (userId, limit) => {
    // Esta es la más compleja. Si no tienes una tabla de logs de actividad,
    // una simulación podría ser obtener los últimos Progress actualizados
    // y los últimos Objetivos creados/actualizados.
    const recentProgress = await Progress.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']],
        limit: limit,
        include: [{ model: Objetivo, as: 'objetivo', attributes: ['nombre'] }]
    });

    const recentObjectives = await Objetivo.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']], // Podrías diferenciar entre createdAt y updatedAt
        limit: limit,
    });

    let activities = [];
    recentProgress.forEach(p => {
        activities.push({
            id: `p-${p.id_progreso}`,
            type: 'PROGRESS_UPDATED',
            description: `Progreso actualizado para '${p.objetivo?.nombre || 'Objetivo desconocido'}' a ${p.valor_actual}`,
            timestamp: p.updatedAt,
            objectiveId: p.id_objetivo
        });
    });
    recentObjectives.forEach(o => {
         // Evitar duplicar si la actualización del objetivo ya generó una "actividad" de progreso
        if (o.createdAt.getTime() === o.updatedAt.getTime()) { // Asumir que es creación
             activities.push({
                id: `o-create-${o.id_objetivo}`,
                type: 'OBJECTIVE_CREATED',
                description: `Nuevo objetivo creado: '${o.nombre}'`,
                timestamp: o.createdAt,
                objectiveId: o.id_objetivo
            });
        } else if (!activities.some(a => a.objectiveId === o.id_objetivo && new Date(a.timestamp).getTime() === new Date(o.updatedAt).getTime())) {
             activities.push({
                id: `o-update-${o.id_objetivo}`,
                type: 'OBJECTIVE_UPDATED', // O más específico si sabes qué cambió
                description: `Objetivo '${o.nombre}' actualizado`,
                timestamp: o.updatedAt,
                objectiveId: o.id_objetivo
            });
        }
    });

    // Ordenar todas las actividades por timestamp y tomar el límite
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return activities.slice(0, limit);
};