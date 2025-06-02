// backend/src/api/services/dashboardService.js
const { Op, fn, col } = require('sequelize');
const db = require('../../config/database');
const { Objetivo, Progress, ActivityLog } = db.sequelize.models; // Asumo que User no se usa directamente aquí, si no, re-añadir
const AppError = require('../../utils/AppError');


exports.calculateSummaryStats = async (userId) => {
    if (!userId) {
        // Este error es interno del servicio, un userId válido debería llegar del controller
        throw new AppError('ID de usuario no fue proporcionado al servicio de cálculo de estadísticas.', 500);
    }

    const totalObjectives = await Objetivo.count({ where: { id_usuario: userId } });

    const statusCountsResult = await Objetivo.findAll({
        attributes: ['estado', [fn('COUNT', col('estado')), 'count']],
        where: { id_usuario: userId },
        group: ['estado'],
        raw: true,
    });
    const statusCounts = statusCountsResult.reduce((acc, item) => {
        acc[item.estado] = parseInt(item.count, 10);
        return acc;
    }, {});

    // Calcular progreso promedio solo para objetivos cuantitativos activos
    const activeQuantitativeObjectives = await Objetivo.findAll({
        where: {
            id_usuario: userId,
            estado: { [Op.in]: ['En progreso', 'Pendiente', 'No Iniciados'] }, // Ajustado para incluir No Iniciados si aplica
            valor_cuantitativo: { [Op.ne]: null },      // Asegura que sea un objetivo cuantitativo
            valor_inicial_numerico: { [Op.ne]: null } // Asegura que tenga un valor inicial para calcular progreso
        },
    });

    let averageProgress = 0;
    if (activeQuantitativeObjectives.length > 0) {
        const totalProgressSum = activeQuantitativeObjectives.reduce((sum, obj) => {
            const initial = parseFloat(obj.valor_inicial_numerico);
            const current = parseFloat(obj.valor_actual); // Asumiendo que valor_actual se actualiza
            const target = parseFloat(obj.valor_cuantitativo);
            let progress = 0;

            if (!isNaN(initial) && !isNaN(current) && !isNaN(target)) {
                if (obj.es_menor_mejor) { // Si el objetivo es alcanzar un valor menor
                    if (initial <= target) { // Si ya se empezó en o por debajo del objetivo
                        progress = (current <= target) ? 100 : 0;
                    } else {
                        const range = initial - target;
                        progress = range <= 0 ? 100 : Math.max(0, ((initial - current) / range) * 100);
                    }
                } else { // Si el objetivo es alcanzar un valor mayor
                    if (initial >= target) { // Si ya se empezó en o por encima del objetivo
                        progress = (current >= target) ? 100 : 0;
                    } else {
                        const range = target - initial;
                        progress = range <= 0 ? 100 : Math.max(0, ((current - initial) / range) * 100);
                    }
                }
                progress = Math.min(100, Math.round(progress)); // Asegurar que el progreso esté entre 0 y 100
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
                [Op.lte]: sevenDaysFromNow, // Fecha fin es menor o igual a 7 días desde hoy
                [Op.gte]: new Date()        // Fecha fin es hoy o en el futuro
            },
            estado: { [Op.notIn]: ['Completado', 'Archivado', 'Fallido'] } // Objetivos no finalizados
        }
    });

    const categoryDistributionResult = await Objetivo.findAll({
        attributes: ['tipo_objetivo', [fn('COUNT', col('tipo_objetivo')), 'count']],
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
        averageProgress,
        dueSoonCount,
        categoryDistribution,
    };
};

exports.fetchRecentObjectives = async (userId, limit) => {
    const objectives = await Objetivo.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']], // Ordenar por la última actualización para mostrar los más recientes
        limit: limit,
        // Incluir solo los atributos necesarios para la previsualización
        attributes: ['id_objetivo', 'nombre', 'estado', 'updatedAt', 'valor_actual', 'valor_cuantitativo', 'valor_inicial_numerico', 'es_menor_mejor'],
    });
    
    // Calcular 'progreso_calculado' en el backend para enviarlo listo al frontend
    return objectives.map(obj => {
        let progressPercentage = 0;
        const initial = parseFloat(obj.valor_inicial_numerico);
        const current = parseFloat(obj.valor_actual);
        const target = parseFloat(obj.valor_cuantitativo);

        if (!isNaN(initial) && !isNaN(current) && !isNaN(target)) {
            if (obj.es_menor_mejor) {
                if (initial <= target) progressPercentage = (current <= target) ? 100 : 0;
                else {
                    const range = initial - target;
                    progressPercentage = range <= 0 ? 100 : ((initial - current) / range) * 100;
                }
            } else {
                if (initial >= target) progressPercentage = (current >= target) ? 100 : 0;
                else {
                    const range = target - initial;
                    progressPercentage = range <= 0 ? 100 : ((current - initial) / range) * 100;
                }
            }
            progressPercentage = Math.max(0, Math.min(100, Math.round(progressPercentage)));
        }
        return {
            id_objetivo: obj.id_objetivo,
            nombre: obj.nombre,
            estado: obj.estado,
            updatedAt: obj.updatedAt,
            progreso_calculado: progressPercentage, // Enviar el progreso calculado
        };
    });
};

exports.fetchRecentActivities = async (userId, limit) => {
    // Simulación de un feed de actividad basado en actualizaciones de progreso y objetivos
    // Para un sistema real, se recomienda una tabla dedicada a logs de actividad.
    const recentProgress = await Progress.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']],
        limit: limit,
        include: [{ model: Objetivo, as: 'objetivo', attributes: ['nombre', 'id_objetivo'] }] // Incluir id_objetivo
    });

    const recentObjectivesActivity = await Objetivo.findAll({
        where: { id_usuario: userId },
        order: [['updatedAt', 'DESC']],
        limit: limit,
        attributes: ['id_objetivo', 'nombre', 'createdAt', 'updatedAt', 'estado'],
    });

    let activities = [];

    recentProgress.forEach(p => {
        activities.push({
            id: `prog-${p.id_progreso}`, // ID único para la actividad de progreso
            type: 'PROGRESS_UPDATED',
            description: `Progreso actualizado para '${p.objetivo?.nombre || 'Objetivo desconocido'}' a ${p.valor_actual}`,
            timestamp: p.updatedAt,
            objectiveId: p.id_objetivo // Referencia al objetivo
        });
    });

    recentObjectivesActivity.forEach(o => {
        // Determinar si es una creación o una actualización significativa del objetivo
        const isCreation = o.createdAt.getTime() === o.updatedAt.getTime();
        const activityType = isCreation ? 'OBJECTIVE_CREATED' 
                            : (o.estado === 'Completado' ? 'OBJECTIVE_COMPLETED' 
                            : (o.estado === 'Fallido' ? 'OBJECTIVE_FAILED' 
                            : (o.estado === 'Archivado' ? 'OBJECTIVE_ARCHIVED' 
                            : 'OBJECTIVE_UPDATED')));
        
        let description = '';
        if (isCreation) {
            description = `Nuevo objetivo creado: '${o.nombre}'`;
        } else if (activityType === 'OBJECTIVE_COMPLETED') {
            description = `Objetivo '${o.nombre}' completado`;
        } else if (activityType === 'OBJECTIVE_FAILED') {
            description = `Objetivo '${o.nombre}' marcado como fallido`;
        } else if (activityType === 'OBJECTIVE_ARCHIVED') {
            description = `Objetivo '${o.nombre}' archivado`;
        } else {
            description = `Objetivo '${o.nombre}' actualizado`;
        }

        // Evitar duplicar la actividad si una actualización de progreso coincide exactamente
        // con la última actualización del objetivo (esto es una heurística).
        const alreadyCoveredByProgress = activities.some(a => 
            a.objectiveId === o.id_objetivo && 
            a.type === 'PROGRESS_UPDATED' &&
            new Date(a.timestamp).getTime() === new Date(o.updatedAt).getTime()
        );

        if (!alreadyCoveredByProgress) {
            activities.push({
                id: `${isCreation ? 'obj-create' : 'obj-update'}-${o.id_objetivo}`,
                type: activityType,
                description: description,
                timestamp: isCreation ? o.createdAt : o.updatedAt,
                objectiveId: o.id_objetivo
            });
        }
    });

    // Ordenar todas las actividades combinadas por fecha y aplicar el límite
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Eliminar duplicados exactos por ID de actividad antes de cortar
    const uniqueActivities = activities.filter((activity, index, self) =>
        index === self.findIndex((a) => (
            a.id === activity.id
        ))
    );

    return uniqueActivities.slice(0, limit);
};

exports.fetchRecentActivities = async (userId, limit) => {
    try {
        const activities = await ActivityLog.findAll({
            where: { id_usuario: userId },
            order: [['createdAt', 'DESC']], // 'createdAt' es el timestamp del log
            limit: limit,
            include: [ // Opcional: incluir el nombre del objetivo si está asociado
                {
                    model: Objetivo,
                    as: 'objetivo', // Debe coincidir con el alias en ActivityLog.associate
                    attributes: ['nombre'] // Solo el nombre del objetivo
                }
            ],
            raw: false, // Para que funcione bien el include y el anidamiento
        });

        // Mapear al formato que espera tu frontend (si es necesario)
        return activities.map(act => {
            // La descripción ya debería estar bien formateada desde donde se creó el log.
            // El 'type' también viene del log.
            // El timestamp es act.createdAt
            return {
                id: act.id_activity_log, // O genera un ID único si es necesario
                type: act.tipo_actividad,
                description: act.descripcion,
                timestamp: act.createdAt, // Usar createdAt como el timestamp de la actividad
                objectiveId: act.id_objetivo, // Disponible si se incluyó y asoció
                objectiveName: act.objetivo ? act.objetivo.nombre : null // Nombre del objetivo si se incluyó
            };
        });

    } catch (error) {
        console.error('Error en fetchRecentActivities (servicio):', error);
        throw new AppError('Error al obtener la actividad reciente.', 500, error);
    }
};