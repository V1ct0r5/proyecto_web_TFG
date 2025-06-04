// backend/src/api/services/analysisService.js
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../../config/database');
const { Objetivo, Progress } = db.sequelize.models; // Usuario no se usa directamente en este servicio por ahora
const AppError = require('../../utils/AppError');

const getDateRange = (period) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Fin del día
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Inicio del día

    switch (period) {
        case '1month': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3months': startDate.setMonth(endDate.getMonth() - 3); break;
        case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
        case '1year': startDate.setFullYear(endDate.getFullYear() - 1); break;
        case 'all':
        default:
            startDate = new Date(0); // Epoch
            break;
    }
    return { startDate, endDate };
};

/**
 * Calcula el progreso de un objetivo.
 * @param {Object} obj - El objeto con propiedades valor_inicial_numerico, valor_actual, valor_cuantitativo, es_menor_mejor.
 * @returns {number} Progreso en porcentaje (0-100).
 */
function _calculateProgress(obj) {
    if (obj.valor_inicial_numerico === null || obj.valor_cuantitativo === null) {
        return 0;
    }
    const initial = parseFloat(obj.valor_inicial_numerico);
    const target = parseFloat(obj.valor_cuantitativo);
    const current = (obj.valor_actual !== null && typeof obj.valor_actual !== 'undefined' && !isNaN(parseFloat(obj.valor_actual)))
        ? parseFloat(obj.valor_actual)
        : initial;

    if (isNaN(initial) || isNaN(target)) {
        return 0;
    }
    if (target === initial) {
        return (obj.es_menor_mejor ? current <= target : current >= target) ? 100 : 0;
    }
    let progress;
    if (obj.es_menor_mejor) {
        if (initial <= target) { // ej: meta es MAX 70 (target), empiezo en 68 (initial).
            return current <= initial ? 100 : 0;
        }
        const range = initial - target;
        progress = (initial - current) / range * 100;
    } else { // Mayor es mejor
        if (initial >= target) { // ej: meta es MIN 500 (target), empiezo en 600 (initial).
            return current >= initial ? 100 : 0;
        }
        const range = target - initial;
        progress = (current - initial) / range * 100;
    }
    return Math.max(0, Math.min(100, Math.round(progress)));
}

exports.getAnalysisSummaryStats = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para resumen.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const totalObjectives = await Objetivo.count({ where: { id_usuario: userId } });
        const activeObjectives = await Objetivo.count({ where: { id_usuario: userId, estado: { [Op.in]: ['En progreso', 'Pendiente', 'No Iniciados'] } } });
        const completedObjectivesInPeriod = await Objetivo.count({
            where: { id_usuario: userId, estado: 'Completado', updatedAt: { [Op.between]: [startDate, endDate] } }
        });

        const quantitativeObjectives = await Objetivo.findAll({
            where: { id_usuario: userId, valor_cuantitativo: { [Op.ne]: null }, valor_inicial_numerico: { [Op.ne]: null } }
        });
        let averageProgress = 0;
        if (quantitativeObjectives.length > 0) {
            const relevantObjectivesForAvg = quantitativeObjectives.filter(obj => obj.estado !== 'Archivado' && obj.estado !== 'Fallido');
            if (relevantObjectivesForAvg.length > 0) {
                const totalProgressSum = relevantObjectivesForAvg.reduce((sum, obj) => sum + _calculateProgress(obj), 0);
                averageProgress = Math.round(totalProgressSum / relevantObjectivesForAvg.length);
            }
        }

        const categoryData = await Objetivo.findAll({
            attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'count']],
            where: { id_usuario: userId, tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''} },
            group: ['tipo_objetivo'], raw: true,
        });
        const categoryCount = categoryData.length;
        const categories = categoryData.map(cat => ({ name: cat.tipo_objetivo, count: parseInt(cat.count, 10) }));
        
        // TODO: Implementar lógica real para calcular la tendencia del progreso.
        const trend = { type: 'neutral', text: 'Estable' }; 

        return {
            totalObjectives, activeObjectives, completedObjectives: completedObjectivesInPeriod,
            averageProgress, categoryCount, categories, trend,
        };
    } catch (error) {
        throw new AppError('Error al obtener estadísticas de resumen del análisis.', 500, error);
    }
};

exports.getCategoryDistribution = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para distribución por categoría.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const distribution = await Objetivo.findAll({
            attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'value']],
            where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] }, tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''} },
            group: ['tipo_objetivo'], raw: true,
        });
        return distribution.map(item => ({ name: item.tipo_objetivo, value: parseInt(item.value, 10) }));
    } catch (error) {
        throw new AppError('Error al obtener la distribución por categoría.', 500, error);
    }
};

exports.getObjectiveStatusDistribution = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para distribución por estado.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const distribution = await Objetivo.findAll({
            attributes: ['estado', [fn('COUNT', col('estado')), 'value']],
            where: { id_usuario: userId, updatedAt: { [Op.between]: [startDate, endDate] } }, // Basado en la última actualización
            group: ['estado'], raw: true,
        });
        return distribution.map(item => ({ name: item.estado, value: parseInt(item.value, 10) }));
    } catch (error) {
        throw new AppError('Error al obtener la distribución por estado de objetivo.', 500, error);
    }
};

exports.getMonthlyProgressByCategory = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para progreso mensual.', 401);
    const { startDate, endDate } = getDateRange(period);
    const dbDialect = db.sequelize.getDialect();

    let dateFunctionMonth;
    if (dbDialect === 'sqlite') dateFunctionMonth = (dateColumn) => fn('strftime', '%Y-%m', dateColumn);
    else if (dbDialect === 'mysql') dateFunctionMonth = (dateColumn) => fn('DATE_FORMAT', dateColumn, '%Y-%m');
    else if (dbDialect === 'postgres') dateFunctionMonth = (dateColumn) => fn('TO_CHAR', dateColumn, 'YYYY-MM');
    else throw new AppError('Dialecto de DB no soportado para formateo de fecha en análisis mensual.', 500);

    try {
        const allUserCategories = await Objetivo.findAll({
            attributes: [[fn('DISTINCT', col('tipo_objetivo')), 'categoryName']],
            where: { id_usuario: userId, tipo_objetivo: { [Op.ne]: null, [Op.ne]: '' } },
            raw: true,
        }).then(cats => cats.map(c => c.categoryName).filter(name => name));

        if (allUserCategories.length === 0) return [];

        const progressEntriesWithData = await Progress.findAll({
            attributes: [
                [dateFunctionMonth(col('Progress.fecha_registro')), 'monthYear'],
                'valor_actual',
            ],
            include: [{
                model: Objetivo,
                as: 'objetivo',
                attributes: ['tipo_objetivo', 'valor_inicial_numerico', 'valor_cuantitativo', 'es_menor_mejor'],
                where: { id_usuario: userId }
            }],
            where: {
                id_usuario: userId,
                fecha_registro: { [Op.between]: [startDate, endDate] },
                '$objetivo.tipo_objetivo$': { [Op.in]: allUserCategories }
            },
            order: [['fecha_registro', 'ASC']],
            raw: true,
            nest: true
        });

        const progressByMonthCategory = {};
        progressEntriesWithData.forEach(entry => {
            const category = entry.objetivo.tipo_objetivo;
            if (!category) return;

            const individualProgress = _calculateProgress({
                valor_inicial_numerico: entry.objetivo.valor_inicial_numerico,
                valor_actual: entry.valor_actual,
                valor_cuantitativo: entry.objetivo.valor_cuantitativo,
                es_menor_mejor: entry.objetivo.es_menor_mejor
            });

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
        currentLoopDate.setDate(1); 
        currentLoopDate.setHours(0,0,0,0);

        const periodEndDate = new Date(endDate);
        // Asegurarse que periodEndDate también está al inicio del mes para la comparación
        // o ajustar el bucle para que termine correctamente incluyendo el último mes.
        // Para un bucle simple basado en <=, si endDate es por ej. June 30, y currentLoopDate es June 1,
        // el bucle se ejecutará para Junio. Si currentLoopDate se va a July 1, la condición fallará.
        // Una forma es iterar hasta el mes de endDate inclusive.

        while(currentLoopDate <= periodEndDate) {
            const monthKey = `${currentLoopDate.getFullYear()}-${(currentLoopDate.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthEntry = { month: monthKey };
            allUserCategories.forEach(catName => {
                monthEntry[catName] = (averagedDataByMonth[monthKey] && averagedDataByMonth[monthKey][catName] !== undefined)
                    ? averagedDataByMonth[monthKey][catName]
                    : 0;
            });
            finalStructuredData.push(monthEntry);
            currentLoopDate.setMonth(currentLoopDate.getMonth() + 1);
        }
        
        finalStructuredData.sort((a,b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime());

        return finalStructuredData;

    } catch (error) {
        throw new AppError('Error al obtener el progreso mensual por categoría.', 500, error);
    }
};

exports.getObjectivesProgressData = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para progreso de objetivos.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const objectives = await Objetivo.findAll({
            where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] } },
            attributes: ['id_objetivo', 'nombre', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'tipo_objetivo'],
        });
        return objectives.map(obj => ({
            id: obj.id_objetivo,
            name: obj.nombre,
            progress: _calculateProgress(obj), // Asegura que el progreso sea 0-100
            category: obj.tipo_objetivo 
        }));
    } catch (error) {
        throw new AppError('Error al obtener datos de progreso de objetivos.', 500, error);
    }
};

exports.getRankedObjectives = async (userId, period = '3months', sort = 'top', limit = 5) => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para ranking.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const objectives = await Objetivo.findAll({
            where: { id_usuario: userId, createdAt: { [Op.between]: [startDate, endDate] } },
            attributes: ['id_objetivo', 'nombre', 'tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida'],
        });
        const objectivesWithProgress = objectives.map(obj => ({
            id_objetivo: obj.id_objetivo,
            nombre: obj.nombre,
            tipo_objetivo: obj.tipo_objetivo,
            progreso_calculado: _calculateProgress(obj),
            unidad_medida: obj.unidad_medida,
            valor_actual: obj.valor_actual,
            valor_cuantitativo: obj.valor_cuantitativo
        }));

        const topRanked = [...objectivesWithProgress].sort((a, b) => b.progreso_calculado - a.progreso_calculado).slice(0, limit);
        const lowRanked = [...objectivesWithProgress].sort((a, b) => a.progreso_calculado - b.progreso_calculado).slice(0, limit);
        
        return { top: topRanked, low: lowRanked };

    } catch (error) {
        throw new AppError('Error al obtener el ranking de objetivos.', 500, error);
    }
};

exports.getCategoryAverageProgress = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para promedio por categoría.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const objectives = await Objetivo.findAll({
            where: {
                id_usuario: userId,
                updatedAt: { [Op.between]: [startDate, endDate] }, // O createdAt según la lógica de negocio
                valor_cuantitativo: { [Op.ne]: null },
                valor_inicial_numerico: { [Op.ne]: null },
                tipo_objetivo: {[Op.ne]: null, [Op.ne]: ''}
            },
            attributes: ['tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor'],
        });

        const progressByCategory = {};
        objectives.forEach(obj => {
            if (!obj.tipo_objetivo) return;
            if (!progressByCategory[obj.tipo_objetivo]) {
                progressByCategory[obj.tipo_objetivo] = { totalProgress: 0, count: 0 };
            }
            progressByCategory[obj.tipo_objetivo].totalProgress += _calculateProgress(obj);
            progressByCategory[obj.tipo_objetivo].count++;
        });

        return Object.keys(progressByCategory).map(categoryName => ({
            categoryName,
            averageProgress: progressByCategory[categoryName].count > 0 ? Math.round(progressByCategory[categoryName].totalProgress / progressByCategory[categoryName].count) : 0
        }));
    } catch (error) {
        throw new AppError('Error al obtener el progreso promedio por categoría.', 500, error);
    }
};

exports.getDetailedObjectivesByCategory = async (userId, period = '3months') => {
    if (!userId) throw new AppError('ID de usuario no proporcionado para detalle por categoría.', 401);
    const { startDate, endDate } = getDateRange(period);
    try {
        const allObjectivesInPeriod = await Objetivo.findAll({
            where: {
                id_usuario: userId,
                tipo_objetivo: { [Op.ne]: null, [Op.ne]: '' },
                createdAt: { [Op.between]: [startDate, endDate] } // O updatedAt si es más relevante
            },
            attributes: ['id_objetivo', 'nombre', 'tipo_objetivo', 'valor_inicial_numerico', 'valor_actual', 'valor_cuantitativo', 'es_menor_mejor', 'unidad_medida'],
        });

        const groupedByCategory = allObjectivesInPeriod.reduce((acc, obj) => {
            const categoryName = obj.tipo_objetivo;
            if (!categoryName) return acc; 
            if (!acc[categoryName]) {
                acc[categoryName] = { categoryName, objectiveCount: 0, objectives: [] };
            }
            acc[categoryName].objectiveCount++;
            acc[categoryName].objectives.push({
                id: obj.id_objetivo,
                nombre: obj.nombre,
                progreso_calculado: _calculateProgress(obj),
                valor_actual: obj.valor_actual,
                valor_cuantitativo: obj.valor_cuantitativo,
                unidad_medida: obj.unidad_medida,
            });
            return acc;
        }, {});
        
        return Object.values(groupedByCategory).filter(catData => catData.objectives.length > 0);
    } catch (error) {
        throw new AppError('Error al obtener objetivos detallados por categoría.', 500, error);
    }
};

module.exports = {
    getAnalysisSummaryStats: exports.getAnalysisSummaryStats,
    getCategoryDistribution: exports.getCategoryDistribution,
    getObjectiveStatusDistribution: exports.getObjectiveStatusDistribution,
    getMonthlyProgressByCategory: exports.getMonthlyProgressByCategory,
    getObjectivesProgressData: exports.getObjectivesProgressData,
    getRankedObjectives: exports.getRankedObjectives,
    getCategoryAverageProgress: exports.getCategoryAverageProgress,
    getDetailedObjectivesByCategory: exports.getDetailedObjectivesByCategory,
};