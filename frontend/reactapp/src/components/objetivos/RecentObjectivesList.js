import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RecentObjectivesList.module.css';
import Button from '../ui/Button';
import { FaArrowRight, FaChartLine } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const RecentObjectivesList = ({ objectives }) => {
    const navigate = useNavigate();

    if (!objectives || objectives.length === 0) {
        return <p className={styles.noData}>No hay objetivos recientes para mostrar.</p>;
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
                                Act. hace {formatDistanceToNow(new Date(obj.updatedAt), { addSuffix: false, locale: es })}
                            </span>
                        </div>
                        <div className={styles.objectiveActions}>
                            <span className={styles.progressPercent}>{obj.progreso_calculado}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/objectives/${obj.id_objetivo}`)}
                                aria-label={`Ver detalles de ${obj.nombre}`}
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
                    Ver todos los objetivos
                </Button>
            </div>
        </div>
    );
};

export default RecentObjectivesList;