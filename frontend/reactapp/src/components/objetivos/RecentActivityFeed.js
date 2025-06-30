import React from 'react';
import styles from './RecentActivityFeed.module.css';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
    FaPlusCircle, FaCheckCircle, FaTimesCircle, FaArchive,
    FaHistory, FaEdit, FaChartLine, FaTrashAlt, FaUndo, FaCog, FaKey, FaDownload, FaUserTimes
} from 'react-icons/fa';

const activityIcons = {
    OBJECTIVE_CREATED: <FaPlusCircle style={{ color: 'var(--success)' }} />,
    PROGRESS_UPDATED: <FaChartLine style={{ color: 'var(--info)' }} />,
    OBJECTIVE_COMPLETED: <FaCheckCircle style={{ color: 'var(--success)' }} />,
    OBJECTIVE_FAILED: <FaTimesCircle style={{ color: 'var(--destructive)' }} />,
    OBJECTIVE_ARCHIVED: <FaArchive style={{ color: 'var(--muted-foreground)' }} />,
    OBJECTIVE_DELETED: <FaTrashAlt style={{ color: 'var(--destructive)' }} />,
    OBJECTIVE_STATUS_CHANGED: <FaEdit style={{ color: 'var(--warning)' }} />,
    OBJECTIVE_ARCHIVED: <FaArchive style={{ color: 'var(--muted-foreground)' }} />,
    OBJECTIVE_UNARCHIVED: <FaUndo style={{ color: 'var(--info)' }} />, // He añadido FaUndo, asegúrate de importarlo también
    USER_SETTINGS_UPDATED: <FaCog style={{ color: 'var(--primary)' }} />,
    USER_PASSWORD_CHANGED: <FaKey style={{ color: 'var(--warning)' }} />,
    USER_DATA_EXPORTED: <FaDownload style={{ color: 'var(--info)' }} />,
    USER_ACCOUNT_DELETED: <FaUserTimes style={{ color: 'var(--destructive)' }} />,
    DEFAULT: <FaHistory style={{ color: 'var(--muted-foreground)' }} />
};

// --- NUEVA FUNCIÓN HELPER ---
/**
 * Convierte un string en formato ENUM (ej. 'IN_PROGRESS') a camelCase (ej. 'inProgress').
 * @param {string} str - El string a convertir.
 * @returns {string} El string en camelCase.
 */
const toCamelCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
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
                {activities.map(act => {
                    const translationKey = act.descriptionKey;
                    let params = {};
                    try {
                        if (typeof act.additionalDetails === 'string') {
                            params = JSON.parse(act.additionalDetails);
                        } else {
                            params = act.additionalDetails || {};
                        }
                    } catch (e) {
                        console.error("Error al parsear detalles_adicionales:", e);
                        params = {};
                    }
                    
                    // --- CORRECCIÓN FINAL ---
                    // Usamos la función helper para normalizar AMBOS estados a camelCase.
                    if (params.oldStatus) {
                        const camelCaseStatus = toCamelCase(params.oldStatus);
                        params.oldStatus = t(`status.${camelCaseStatus}`, params.oldStatus);
                    }
                    if (params.newStatus) {
                        const camelCaseStatus = toCamelCase(params.newStatus);
                        params.newStatus = t(`status.${camelCaseStatus}`, params.newStatus);
                    }

                    const translatedDescription = t(translationKey, params);
                    
                    const date = act.createdAt ? parseISO(act.createdAt) : null;
                    let timeAgo = '';
                    if (date && isValid(date)) {
                        timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: currentLocale });
                    }

                    return (
                        <li key={act.id} className={styles.feedItem}>
                            <div className={styles.activityIcon}>
                                {activityIcons[act.activityType] || activityIcons.DEFAULT}
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