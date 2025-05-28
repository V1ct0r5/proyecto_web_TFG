import React from 'react';
import styles from './RecentActivityFeed.module.css';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
// Importa iconos para representar diferentes tipos de actividad
import { FaPlusCircle, FaEdit, FaCheckCircle, FaTimesCircle, FaArchive, FaHistory } from 'react-icons/fa';

// Mapeo de tipos de actividad a componentes de icono con estilos aplicados
const activityIcons = {
    OBJECTIVE_CREATED: <FaPlusCircle style={{color: 'var(--success-color)'}}/>,
    PROGRESS_UPDATED: <FaEdit style={{color: 'var(--info-color)'}}/>,
    OBJECTIVE_COMPLETED: <FaCheckCircle style={{color: 'var(--success-color)'}}/>,
    OBJECTIVE_FAILED: <FaTimesCircle style={{color: 'var(--destructive-color)'}}/>,
    OBJECTIVE_ARCHIVED: <FaArchive style={{color: 'var(--muted-foreground)'}}/>,
    DEFAULT: <FaHistory style={{color: 'var(--muted-foreground)'}}/> // Icono por defecto si el tipo no se reconoce
};

const RecentActivityFeed = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <p className={styles.noData}>No hay actividad reciente.</p>;
    }

    return (
        <div className={styles.feedContainer}>
            <h3 className={styles.feedTitle}>Actividad Reciente</h3>
            <ul className={styles.feedList}>
                {activities.map(act => (
                    <li key={act.id} className={styles.feedItem}>
                        <div className={styles.activityIcon}>
                            {activityIcons[act.type] || activityIcons.DEFAULT}
                        </div>
                        <div className={styles.activityContent}>
                            <p className={styles.activityDescription}>{act.description}</p>
                            <span className={styles.activityTime}>
                                {/* Formatea la fecha para mostrar "Hace X tiempo" en español */}
                                Hace {formatDistanceToNow(new Date(act.timestamp), { addSuffix: false, locale: es })}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentActivityFeed;