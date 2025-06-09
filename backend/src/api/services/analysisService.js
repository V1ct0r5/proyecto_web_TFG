// backend/src/api/services/analysisService.js
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../../config/database');
const { Objetivo, Progress } = db.sequelize.models;
const AppError = require('../../utils/AppError');

// ... (Las funciones de utilidad como categoryToKey, statusToKey, getDateRange y _calculateProgress no cambian)

const categoryToKey = (name) => {
    const map = { 'Finanzas': 'categories.finance', 'Salud': 'categories.health', 'Desarrollo personal': 'categories.personalDevelopment', 'Relaciones': 'categories.relationships', 'Carrera profesional': 'categories.career', 'Otros': 'categories.other' };
    return map[name] || name;
};
const statusToKey = (name) => {
    const map = { 'En progreso': 'status.inProgress', 'Completado': 'status.completed', 'Pendiente': 'status.pending', 'Fallido': 'status.failed', 'Archivado': 'status.archived', 'No Iniciados': 'status.notStarted' };
    return map[name] || name;
};
const getDateRange = (period) => {
    const endDate = new Date(); endDate.setHours(23, 59, 59, 999);
    let startDate = new Date(); startDate.setHours(0, 0, 0, 0);
    switch (period) {
        case '1month': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3months': startDate.setMonth(endDate.getMonth() - 3); break;
        case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
        case '1year': startDate.setFullYear(endDate.getFullYear() - 1); break;
        case 'all': default: startDate = new Date(0); break;
    }
    return { startDate, endDate };
};
function _calculateProgress(obj) {
    if (obj.valor_inicial_numerico === null || obj.valor_cuantitativo === null) return 0;
    const initial = parseFloat(obj.valor_inicial_numerico);
    const target = parseFloat(obj.valor_cuantitativo);
    const current = (obj.valor_actual !== null && typeof obj.valor_actual !== 'undefined' && !isNaN(parseFloat(obj.valor_actual))) ? parseFloat(obj.valor_actual) : initial;
    if (isNaN(initial) || isNaN(target)) return 0;
    if (target === initial) return (obj.es_menor_mejor ? current <= target : current >= target) ? 100 : 0;
    let progress;
    if (obj.es_menor_mejor) {
        if (initial <= target) return current <= initial ? 100 : 0;
        const range = initial - target;
        progress = (initial - current) / range * 100;
    } else {
        if (initial >= target) return current >= initial ? 100 : 0;
        const range = target - initial;
        progress = (current - initial) / range * 100;
    }
    return Math.max(0, Math.min(100, Math.round(progress)));
}
const getAverageProgressAtDate = async (userId, objectives, date) => {
    const existingObjectives = objectives.filter(obj => new Date(obj.createdAt) <= date);
    if (existingObjectives.length === 0) return 0;
    const objectiveIds = existingObjectives.map(obj => obj.id_objetivo);
    const progressRecordsPromises = objectiveIds.map(id => Progress.findOne({ where: { id_objetivo: id, fecha_registro: { [Op.lte]: date } }, order: [['fecha_registro', 'DESC']] }));
    const progressRecords = await Promise.all(progressRecordsPromises);
    let totalProgress = 0;
    let countedObjectives = 0;
    existingObjectives.forEach((obj, index) => {
        const record = progressRecords[index];
        const progress = _calculateProgress({ ...obj.get({ plain: true }), valor_actual: record ? record.valor_actual : obj.valor_actual });
        totalProgress += progress;
        countedObjectives++;
    });
    return countedObjectives > 0 ? totalProgress / countedObjectives : 0;
};
const calculateProgressTrend = async (userId, startDate, endDate) => {
    const periodDuration = endDate.getTime() - startDate.getTime();
    if (periodDuration <= 0) return { type: 'neutral', textKey: 'analysis.trends.stable' };
    const midpointDate = new Date(startDate.getTime() + periodDuration / 2);
    const relevantObjectives = await Objetivo.findAll({ where: { id_usuario: userId, valor_cuantitativo: { [Op.ne]: null }, estado: { [Op.notIn]: ['Archivado', 'Fallido'] } } });
    if (relevantObjectives.length === 0) return { type: 'neutral', textKey: 'analysis.trends.stable' };
    const firstHalfProgress = await getAverageProgressAtDate(userId, relevantObjectives, midpointDate);
    const secondHalfProgress = await getAverageProgressAtDate(userId, relevantObjectives, endDate);
    const difference = secondHalfProgress - firstHalfProgress;
    if (difference > 5) return { type: 'positive', textKey: 'analysis.trends.positive' };
    if (difference < -5) return { type: 'negative', textKey: 'analysis.trends.negative' };
    return { type: 'neutral', textKey: 'analysis.trends.stable' };
};

// --- INICIO DE LAS CORRECCIONES EN LAS FUNCIONES EXPORTADAS ---

exports.getAnalysisSummaryStats = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para resumen.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        // --- CORRECCIÓN: Contar solo los que NO están archivados ---
        const totalObjectives = await Objetivo.count({ where: { id_usuario: userId, estado: { [Op.not]: 'Archivado' } } });
        const activeObjectives = await Objetivo.count({ where: { id_usuario: userId, estado: { [Op.in]: ['En progreso', 'Pendiente', 'No Iniciado'] } } });
        const completedObjectivesInPeriod = await Objetivo.count({ where: { id_usuario: userId, estado: 'Completado', updatedAt: { [Op.between]: [startDate, endDate] } } });
        
        // El filtro aquí ya era correcto, se mantiene
        const quantitativeObjectives = await Objetivo.findAll({ where: { id_usuario: userId, valor_cuantitativo: { [Op.ne]: null }, valor_inicial_numerico: { [Op.ne]: null }, estado: { [Op.not]: 'Archivado' } } });
        let averageProgress = 0;
        if (quantitativeObjectives.length > 0) {
            const totalProgressSum = quantitativeObjectives.reduce((sum, obj) => sum + _calculateProgress(obj), 0);
            averageProgress = Math.round(totalProgressSum / quantitativeObjectives.length);
        }

        // --- CORRECCIÓN: Excluir archivados del conteo de categorías ---
        const categoryData = await Objetivo.findAll({
            attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'count']],
            where: { id_usuario: userId, tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''}, estado: { [Op.not]: 'Archivado' } },
            group: ['tipo_objetivo'], raw: true,
        });
        const categoryCount = categoryData.length;
        const categories = categoryData.map(cat => ({ name: cat.tipo_objetivo, count: parseInt(cat.count, 10) }));
        
        const trend = await calculateProgressTrend(userId, startDate, endDate);

        return { totalObjectives, activeObjectives, completedObjectives: completedObjectivesInPeriod, averageProgress, categoryCount, categories, trend };
    } catch (error) {
        throw new AppError('Error al obtener estadísticas de resumen del análisis.', 500, error);
    }
};

exports.getCategoryDistribution = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const distribution = await Objetivo.findAll({
        attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'value']],
        // --- CORRECCIÓN: Excluir archivados ---
        where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] }, tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''}, estado: { [Op.not]: 'Archivado' } },
        group: ['tipo_objetivo'], raw: true,
    });
    return distribution.map(item => ({ name: item.tipo_objetivo, nameKey: categoryToKey(item.tipo_objetivo), value: parseInt(item.value, 10) }));
};

exports.getObjectiveStatusDistribution = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const distribution = await Objetivo.findAll({
        attributes: ['estado', [fn('COUNT', col('estado')), 'value']],
         // --- CORRECCIÓN: Excluir archivados ---
        where: { id_usuario: userId, updatedAt: { [Op.between]: [startDate, endDate] }, estado: { [Op.not]: 'Archivado' } },
        group: ['estado'], raw: true,
    });
    return distribution.map(item => ({ name: item.estado, nameKey: statusToKey(item.estado), value: parseInt(item.value, 10) }));
};

exports.getMonthlyProgressByCategory = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const dbDialect = db.sequelize.getDialect();
    let dateFunctionMonth;
    if (dbDialect === 'sqlite') dateFunctionMonth = (dateColumn) => fn('strftime', '%Y-%m', dateColumn);
    else if (dbDialect === 'mysql') dateFunctionMonth = (dateColumn) => fn('DATE_FORMAT', dateColumn, '%Y-%m');
    else if (dbDialect === 'postgres') dateFunctionMonth = (dateColumn) => fn('TO_CHAR', dateColumn, 'YYYY-MM');
    else throw new AppError('Dialecto de DB no soportado.', 500);

    const allUserCategories = await Objetivo.findAll({
        attributes: [[fn('DISTINCT', col('tipo_objetivo')), 'categoryName']],
        // --- CORRECCIÓN: Excluir archivados ---
        where: { id_usuario: userId, tipo_objetivo: { [Op.ne]: null, [Op.ne]: '' }, estado: { [Op.not]: 'Archivado' } },
        raw: true,
    }).then(cats => cats.map(c => c.categoryName).filter(name => name));

    if (allUserCategories.length === 0) return [];

    const progressEntriesWithData = await Progress.findAll({
        attributes: [ [dateFunctionMonth(col('Progress.fecha_registro')), 'monthYear'], 'valor_actual' ],
        include: [{
            model: Objetivo, as: 'objetivo', attributes: ['tipo_objetivo', 'valor_inicial_numerico', 'valor_cuantitativo', 'es_menor_mejor'],
            // --- CORRECCIÓN: Excluir archivados también en el include ---
            where: { id_usuario: userId, estado: { [Op.not]: 'Archivado' } }
        }],
        where: {
            id_usuario: userId, fecha_registro: { [Op.between]: [startDate, endDate] },
            '$objetivo.tipo_objetivo$': { [Op.in]: allUserCategories }
        },
        order: [['fecha_registro', 'ASC']], raw: true, nest: true
    });
    
    // El resto de la lógica de procesamiento no cambia...
    const progressByMonthCategory = {};
    progressEntriesWithData.forEach(entry => {
        const category = entry.objetivo.tipo_objetivo;
        if (!category) return;
        const individualProgress = _calculateProgress({ valor_inicial_numerico: entry.objetivo.valor_inicial_numerico, valor_actual: entry.valor_actual, valor_cuantitativo: entry.objetivo.valor_cuantitativo, es_menor_mejor: entry.objetivo.es_menor_mejor });
        const monthKey = entry.monthYear;
        if (!progressByMonthCategory[monthKey]) progressByMonthCategory[monthKey] = {};
        if (!progressByMonthCategory[monthKey][category]) progressByMonthCategory[monthKey][category] = [];
        progressByMonthCategory[monthKey][category].push(individualProgress);
    });
    const averagedDataByMonth = {};
    for (const monthKey in progressByMonthCategory) {
        averagedDataByMonth[monthKey] = { month: monthKey };
        for (const category of allUserCategories) {
             const progressArray = progressByMonthCategory[monthKey][category];
             if (progressArray && progressArray.length > 0) {
                 const sum = progressArray.reduce((acc, val) => acc + val, 0);
                 averagedDataByMonth[monthKey][category] = Math.round(sum / progressArray.length);
             } else {
                 averagedDataByMonth[monthKey][category] = 0;
             }
        }
    }
    const finalStructuredData = [];
    let currentLoopDate = new Date(startDate);
    currentLoopDate.setDate(1); currentLoopDate.setHours(0,0,0,0);
    const periodEndDate = new Date(endDate);
    while(currentLoopDate <= periodEndDate) {
        const monthKey = `${currentLoopDate.getFullYear()}-${(currentLoopDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthEntry = { month: monthKey };
        allUserCategories.forEach(catName => {
            monthEntry[catName] = (averagedDataByMonth[monthKey] && averagedDataByMonth[monthKey][catName] !== undefined) ? averagedDataByMonth[monthKey][catName] : 0;
        });
        finalStructuredData.push(monthEntry);
        currentLoopDate.setMonth(currentLoopDate.getMonth() + 1);
    }
    finalStructuredData.sort((a,b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime());
    return finalStructuredData;
};

exports.getObjectivesProgressData = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const objectives = await Objetivo.findAll({
        // --- CORRECCIÓN: Excluir archivados ---
        where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] }, estado: { [Op.not]: 'Archivado' } },
        attributes: ['id_objetivo', 'nombre', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'tipo_objetivo'],
    });
    return objectives.map(obj => ({ id: obj.id_objetivo, name: obj.nombre, progress: _calculateProgress(obj), category: obj.tipo_objetivo }));
};

exports.getRankedObjectives = async (userId, period = '3months', sort = 'top', limit = 5) => {
    const { startDate, endDate } = getDateRange(period);
    const objectives = await Objetivo.findAll({
        // --- CORRECCIÓN: Excluir archivados ---
        where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] }, estado: { [Op.not]: 'Archivado' } },
        attributes: ['id_objetivo', 'nombre', 'tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida'],
    });
    const objectivesWithProgress = objectives.map(obj => ({ id_objetivo: obj.id_objetivo, nombre: obj.nombre, tipo_objetivo: obj.tipo_objetivo, progreso_calculado: _calculateProgress(obj), unidad_medida: obj.unidad_medida, valor_actual: obj.valor_actual, valor_cuantitativo: obj.valor_cuantitativo }));
    const topRanked = [...objectivesWithProgress].sort((a, b) => b.progreso_calculado - a.progreso_calculado).slice(0, limit);
    const lowRanked = [...objectivesWithProgress].sort((a, b) => a.progreso_calculado - b.progreso_calculado).slice(0, limit);
    return { top: topRanked, low: lowRanked };
};

exports.getCategoryAverageProgress = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const objectives = await Objetivo.findAll({
        where: {
            id_usuario: userId, updatedAt: { [Op.between]: [startDate, endDate] },
            valor_cuantitativo: { [Op.ne]: null }, valor_inicial_numerico: { [Op.ne]: null },
            tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''},
            // --- CORRECCIÓN: Excluir archivados ---
            estado: { [Op.not]: 'Archivado' }
        },
        attributes: ['tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor'],
    });
    const progressByCategory = {};
    objectives.forEach(obj => {
        if (!obj.tipo_objetivo) return;
        if (!progressByCategory[obj.tipo_objetivo]) { progressByCategory[obj.tipo_objetivo] = { totalProgress: 0, count: 0 }; }
        progressByCategory[obj.tipo_objetivo].totalProgress += _calculateProgress(obj);
        progressByCategory[obj.tipo_objetivo].count++;
    });
    return Object.keys(progressByCategory).map(categoryName => ({ categoryName, averageProgress: progressByCategory[categoryName].count > 0 ? Math.round(progressByCategory[categoryName].totalProgress / progressByCategory[categoryName].count) : 0 }));
};

exports.getDetailedObjectivesByCategory = async (userId, period = '3months') => {
    const { startDate, endDate } = getDateRange(period);
    const allObjectivesInPeriod = await Objetivo.findAll({
        where: {
            id_usuario: userId, tipo_objetivo: { [Op.ne]: null, [Op.ne]: '' },
            createdAt: { [Op.between]: [startDate, endDate] },
            // --- CORRECCIÓN: Excluir archivados ---
            estado: { [Op.not]: 'Archivado' }
        },
        attributes: ['id_objetivo', 'nombre', 'tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida'],
    });
    const groupedByCategory = allObjectivesInPeriod.reduce((acc, obj) => {
        const categoryName = obj.tipo_objetivo;
        if (!categoryName) return acc; 
        if (!acc[categoryName]) { acc[categoryName] = { categoryName, objectiveCount: 0, objectives: [] }; }
        acc[categoryName].objectiveCount++;
        acc[categoryName].objectives.push({ id: obj.id_objetivo, nombre: obj.nombre, progreso_calculado: _calculateProgress(obj), valor_actual: obj.valor_actual, valor_cuantitativo: obj.valor_cuantitativo, unidad_medida: obj.unidad_medida });
        return acc;
    }, {});
    return Object.values(groupedByCategory).filter(catData => catData.objectives.length > 0);
};
