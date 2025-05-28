import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';
import {
    MdFavorite,
    MdAttachMoney,
    MdAutoStories,
    MdPeople,
    MdWork,
    MdStar,
    MdCalendarToday,
    MdEdit,
    MdOutlineRemoveRedEye
} from 'react-icons/md';

function ObjetivoCard({ objective }) {
    const navigate = useNavigate();

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Salud': return <MdFavorite />;
            case 'Finanzas': return <MdAttachMoney />;
            case 'Desarrollo personal': return <MdAutoStories />;
            case 'Relaciones': return <MdPeople />;
            case 'Carrera profesional': return <MdWork />;
            default: return <MdStar />;
        }
    };

    let progressPercentage = 0;
    let showProgressBar = false;

    const initialValueStr = objective.valor_inicial_numerico;
    const targetValueStr = objective.valor_cuantitativo;
    const currentValueStr = objective.valor_actual;
    const isLowerBetter = objective.es_menor_mejor;

    let initialValue = NaN, targetValue = NaN, currentValue = NaN;
    let hasQuantitativeValues = false;

    const isPotentiallyQuantitative =
        initialValueStr !== null && typeof initialValueStr !== 'undefined' &&
        targetValueStr !== null && typeof targetValueStr !== 'undefined';

    if (isPotentiallyQuantitative) {
        initialValue = parseFloat(initialValueStr);
        targetValue = parseFloat(targetValueStr);

        if (currentValueStr !== null && typeof currentValueStr !== 'undefined' && !isNaN(parseFloat(currentValueStr))) {
            currentValue = parseFloat(currentValueStr);
        } else if (!isNaN(initialValue)) {
            currentValue = initialValue;
        }

        if (!isNaN(initialValue) && !isNaN(targetValue) && !isNaN(currentValue)) {
            hasQuantitativeValues = true;
        }
    }

    if (hasQuantitativeValues) {
        showProgressBar = true;

        if (initialValue === targetValue) {
            progressPercentage = (isLowerBetter ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
        } else {
            let totalRangeEffective;
            let progressMadeEffective;

            if (isLowerBetter) {
                totalRangeEffective = initialValue - targetValue;
                progressMadeEffective = initialValue - currentValue;
            } else {
                totalRangeEffective = targetValue - initialValue;
                progressMadeEffective = currentValue - initialValue;
            }

            if (totalRangeEffective <= 0) {
                 progressPercentage = (isLowerBetter ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
            } else {
                progressPercentage = (progressMadeEffective / totalRangeEffective) * 100;
            }
        }
        progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    } else {
        showProgressBar = false;
        progressPercentage = 0;
    }

    if (objective.estado === 'Completado') {
        progressPercentage = 100;
        showProgressBar = true;
    } else if (objective.estado === 'Pendiente') {
        showProgressBar = hasQuantitativeValues;
    }

    const lastUpdated = objective.updatedAt ? new Date(objective.updatedAt).toLocaleDateString() : 'N/A';
    const statusClassName = `status-${objective.estado?.toLowerCase().replace(/\s/g, '')}`;

    return (
        <div className={styles.objetivoCard}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeaderContent}>
                    <h3 className={styles.cardTitle}>{objective.nombre}</h3>
                    <div className={styles.categoryBadge}>
                        <span className={styles.categoryBadgeIcon}>{getCategoryIcon(objective.tipo_objetivo)}</span>
                        <span className={styles.categoryBadgeName}>{objective.tipo_objetivo}</span>
                    </div>
                </div>

                {objective.descripcion && (
                    <p className={styles.cardDescription}>{objective.descripcion}</p>
                )}

                {showProgressBar && (
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>Progreso</span>
                            <span className={styles.progressPercentage}>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${
                                    progressPercentage < 33 ? styles.progressFillLow :
                                    progressPercentage < 66 ? styles.progressFillMedium :
                                    styles.progressFillHigh
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100,progressPercentage))}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {showProgressBar && hasQuantitativeValues && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Actual:</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(currentValue) ? (initialValueStr !== null && typeof initialValueStr !== 'undefined' && !isNaN(parseFloat(initialValueStr)) ? parseFloat(initialValueStr).toLocaleString() : 'N/A') : currentValue.toLocaleString()} {objective.unidad_medida || ''}
                            </div>
                        </div>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Meta:</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(targetValue) ? 'N/A' : targetValue.toLocaleString()} {objective.unidad_medida || ''}
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.progressDate}>
                    <MdCalendarToday className={styles.dataIcon} />
                    <span className={styles.dataLabel}>Actualizado:</span>
                    <span className={styles.dataValue}>{lastUpdated}</span>
                </div>
                <div className={`${styles.cardStatus} ${styles[statusClassName]}`}>
                    {objective.estado}
                </div>
            </div>
            <div className={styles.cardFooter}>
                <div className={styles.cardActions}>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={() => navigate(`/objectives/edit/${objective.id_objetivo}`)}
                        aria-label={`Editar objetivo ${objective.nombre}`}
                    >
                        <MdEdit className={styles.buttonIcon} />
                        Editar
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={() => navigate(`/objectives/${objective.id_objetivo}`)}
                        aria-label={`Ver detalles del objetivo ${objective.nombre}`}
                    >
                        <MdOutlineRemoveRedEye className={styles.buttonIcon} />
                        Detalles
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ObjetivoCard;