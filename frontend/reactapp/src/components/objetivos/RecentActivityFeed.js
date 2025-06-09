import React from 'react';
import styles from './RecentActivityFeed.module.css';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
    FaPlusCircle, FaCheckCircle, FaTimesCircle, FaArchive,
    FaHistory, FaEdit, FaChartLine, FaTrashAlt
} from 'react-icons/fa';

const activityIcons = {
    OBJECTIVE_CREATED: <FaPlusCircle style={{ color: 'var(--success)' }} />,
    PROGRESS_UPDATED: <FaChartLine style={{ color: 'var(--info)' }} />,
    OBJECTIVE_COMPLETED: <FaCheckCircle style={{ color: 'var(--success)' }} />,
    OBJECTIVE_FAILED: <FaTimesCircle style={{ color: 'var(--destructive)' }} />,
    OBJECTIVE_ARCHIVED: <FaArchive style={{ color: 'var(--muted-foreground)' }} />,
    OBJECTIVE_DELETED: <FaTrashAlt style={{ color: 'var(--destructive)' }} />,
    OBJECTIVE_STATUS_CHANGED: <FaEdit style={{ color: 'var(--warning)' }} />,
    DEFAULT: <FaHistory style={{ color: 'var(--muted-foreground)' }} />
};

const RecentActivityFeed = ({ activities }) => {
    const { t, i18n } = useTranslation();
    const dateFnsLocales = { es: es, en: enUS };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;

    // =================================================================
    // ======> ESTA ES LA LÍNEA MÁS IMPORTANTE PARA DEPURAR <======
    console.log('Verificando datos de actividades que llegan al componente:', activities);
    console.log('Verificando las CLAVES (keys):', activities.map(act => act.id_log));
    // =================================================================

    if (!activities || activities.length === 0) {
        return <p className={styles.noData}>{t('activityFeed.noRecentActivity')}</p>;
    }

    return (
        <div className={styles.feedContainer}>
            <ul className={styles.feedList}>
                {activities.map(act => {
                    const translationKey = act.descripcion;
                    let params = {};
                    try {
                        if (typeof act.detalles_adicionales === 'string') {
                            params = JSON.parse(act.detalles_adicionales);
                        } else {
                            params = act.detalles_adicionales || {};
                        }
                    } catch (e) {
                        console.error("Error al parsear detalles_adicionales:", e);
                        params = {};
                    }
                    
                    if (params.oldStatusKey) {
                        params.oldStatus = t(params.oldStatusKey);
                    }
                    if (params.newStatusKey) {
                        params.newStatus = t(params.newStatusKey);
                    }

                    const translatedDescription = t(translationKey, params);
                    
                    const timestamp = act.createdAt || act.timestamp;
                    const date = timestamp ? parseISO(timestamp) : null;
                    let timeAgo = '';
                    if (date && isValid(date)) {
                        timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: currentLocale });
                    }

                    return (
                        <li key={act.id_log} className={styles.feedItem}>
                            <div className={styles.activityIcon}>
                                {activityIcons[act.tipo_actividad] || activityIcons.DEFAULT}
                            </div>
                            <div className={styles.activityContent}>
                                <p className={styles.activityDescription}>
                                    {translatedDescription}
                                </p>
                                {timeAgo && (
                                    <span className={styles.activityTime}>
                                        {timeAgo}
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default RecentActivityFeed;