import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RecentObjectivesList.module.css';
import Button from '../ui/Button';
import { FaArrowRight, FaChartLine } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const RecentObjectivesList = ({ objectives }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    const dateFnsLocales = { es: es, en: enUS };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;

    if (!objectives || objectives.length === 0) {
        return <p className={styles.noData}>{t('recentObjectives.noData')}</p>;
    }

    return (
        <div className={styles.listContainer}>
            <ul className={styles.list}>
                {objectives.map(obj => (
                    <li key={obj.id_objetivo} className={styles.listItem}>
                        <div className={styles.objectiveIcon}>
                            <FaChartLine />
                        </div>
                        <div className={styles.objectiveInfo}>
                            <Link to={`/objectives/${obj.id_objetivo}`} className={styles.objectiveNameLink}>
                                {obj.nombre}
                            </Link>
                            <span className={styles.lastUpdate}>
                                {t('recentObjectives.updatedAgo', { distance: formatDistanceToNow(new Date(obj.updatedAt), { addSuffix: false, locale: currentLocale }) })}
                            </span>
                        </div>
                        <div className={styles.objectiveActions}>
                            <span className={styles.progressPercent}>{obj.progreso_calculado}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/objectives/${obj.id_objetivo}`)}
                                aria-label={t('recentObjectives.viewDetailsAria', {name: obj.nombre})}
                                className={styles.detailsButton}
                            >
                                <FaArrowRight />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
            <div className={styles.viewAllButtonContainer}>
                <Button onClick={() => navigate('/mis-objetivos')} variant="outline" size="small">
                    {t('recentObjectives.viewAllObjectives')}
                </Button>
            </div>
        </div>
    );
};

export default RecentObjectivesList;