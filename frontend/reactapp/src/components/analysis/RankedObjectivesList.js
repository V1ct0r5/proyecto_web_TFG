import React from 'react';
import styles from './RankedObjectivesList.module.css';
import { Link } from 'react-router-dom';

const InlineProgressBar = ({ percentage, color }) => {
    return (
        <div className={styles.inlineProgressBarContainer}>
            <div
                className={styles.inlineProgressFill}
                style={{ width: `${Math.max(0, Math.min(100, percentage))}%`, backgroundColor: color || 'var(--primary)' }}
            />
        </div>
    );
};

const RankedObjectivesList = ({ title, objectives, noDataMessage = "No hay objetivos para mostrar." }) => {
    if (!objectives || objectives.length === 0) {
        return (
            <div className={styles.rankedListContainer}>
                <h4 className={styles.listTitle}>{title}</h4>
                <p className={styles.noDataText}>{noDataMessage}</p>
            </div>
        );
    }

    return (
        <div className={styles.rankedListContainer}>
            <h4 className={styles.listTitle}>{title}</h4>
            <ul className={styles.objectiveList}>
                {objectives.map(obj => (
                    <li key={obj.id_objetivo || obj.id} className={styles.objectiveItem}>
                        <Link to={`/objectives/${obj.id_objetivo || obj.id}`} className={styles.objectiveLink}>
                            <div className={styles.objectiveInfo}>
                                <span className={styles.objectiveName}>{obj.nombre}</span>
                                {obj.tipo_objetivo && <span className={styles.objectiveCategory}>{obj.tipo_objetivo}</span>}
                            </div>
                            <div className={styles.objectiveProgressDetails}>
                                <span className={styles.objectivePercentage}>{Math.round(obj.progreso_calculado)}%</span>
                            </div>
                        </Link>
                        <InlineProgressBar percentage={obj.progreso_calculado} color={obj.color} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RankedObjectivesList;