import React from 'react';
import styles from './RecentActivityFeed.module.css';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
// Importa iconos para representar diferentes tipos de actividad
import {
    FaPlusCircle,
    FaCheckCircle,
    FaTimesCircle,
    FaArchive,
    FaHistory,
    FaEdit,
    FaChartLine,
    FaTrashAlt
} from 'react-icons/fa';

const activityIcons = {
    OBJECTIVE_CREATED: <FaPlusCircle style={{color: 'var(--success-color)'}}/>,
    PROGRESS_UPDATED: <FaChartLine style={{color: 'var(--info-color)'}}/>,
    OBJECTIVE_COMPLETED: <FaCheckCircle style={{color: 'var(--success-color)'}}/>,
    OBJECTIVE_FAILED: <FaTimesCircle style={{color: 'var(--destructive-color)'}}/>,
    OBJECTIVE_ARCHIVED: <FaArchive style={{color: 'var(--muted-foreground)'}}/>,
    OBJECTIVE_DELETED: <FaTrashAlt style={{color: 'var(--destructive-color)'}}/>,
    OBJECTIVE_STATUS_CHANGED: <FaEdit style={{color: 'var(--warning-color)'}}/>,
    DEFAULT: <FaHistory style={{color: 'var(--muted-foreground)'}}/>
};

const RecentActivityFeed = ({ activities }) => {
    const { t, i18n } = useTranslation();

    const dateFnsLocales = { es: es, en: enUS };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;

    if (!activities || activities.length === 0) {
        return <p className={styles.noData}>{t('activityFeed.noRecentActivity')}</p>;
    }

    return (
        <div className={styles.feedContainer}>
            <ul className={styles.feedList}>
                {activities.map(act => (
                    <li key={act.id} className={styles.feedItem}>
                        <div className={styles.activityIcon}>
                            {activityIcons[act.type] || activityIcons.DEFAULT}
                        </div>
                        <div className={styles.activityContent}>
                            <p className={styles.activityDescription}>{act.description}</p>
                            <span className={styles.activityTime}>
                                {t('activityFeed.ago', { distance: formatDistanceToNow(new Date(act.timestamp), { addSuffix: false, locale: currentLocale }) })}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentActivityFeed;