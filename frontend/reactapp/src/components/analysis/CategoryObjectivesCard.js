import React from 'react';
import styles from './CategoryObjectivesCard.module.css';
import { Link } from 'react-router-dom';

const InlineProgressBar = ({ percentage, color }) => (
    <div className={styles.inlineProgressBarContainer}>
        <div className={styles.inlineProgressFill} style={{ width: `${Math.max(0, Math.min(100, percentage))}%`, backgroundColor: color || 'var(--primary)' }} />
    </div>
);

const CategoryObjectivesCard = ({ categoryName, objectiveCount, objectives, color }) => {
    return (
        <div className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
                <span className={styles.categoryColorDot} style={{ backgroundColor: color }}></span>
                <h4 className={styles.categoryName}>{categoryName}</h4>
                <span className={styles.objectiveCountBadge}>{objectiveCount} objetivo{objectiveCount !== 1 ? 's' : ''}</span>
            </div>
            {objectives && objectives.length > 0 ? (
                <ul className={styles.objectivesList}>
                    {objectives.map(obj => (
                        <li key={obj.id_objetivo || obj.id} className={styles.objectiveItem}>
                            <Link to={`/objectives/${obj.id_objetivo || obj.id}`} className={styles.objectiveNameLink}>
                                {obj.nombre}
                            </Link>
                            <div className={styles.objectiveProgressInfo}>
                                <span>{Math.round(obj.progreso_calculado)}%</span>
                                {obj.valor_actual !== undefined && obj.valor_cuantitativo !== undefined && obj.unidad_medida &&
                                    <span className={styles.objectiveValues}>
                                        ({obj.valor_actual}{obj.unidad_medida} / {obj.valor_cuantitativo}{obj.unidad_medida})
                                    </span>
                                }
                            </div>
                            <InlineProgressBar percentage={obj.progreso_calculado} color={color} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.noObjectivesText}>No hay objetivos en esta categoría.</p>
            )}
        </div>
    );
};

export default CategoryObjectivesCard;