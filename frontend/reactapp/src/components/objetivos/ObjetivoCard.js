import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';
import {
    FaChartLine,
    FaArrowRight,
    FaRegDotCircle,
    FaHeartbeat,
    FaPiggyBank,
    FaUserGraduate,
    FaUsers,
    FaBriefcase,
    FaStar,
    FaEdit,
    FaEye,
    FaCalendarAlt
} from 'react-icons/fa';

const getObjectiveTypeIcon = (category) => {
    switch (category) {
        case 'Salud': return <FaHeartbeat className={styles.listItemTypeIcon} />;
        case 'Finanzas': return <FaPiggyBank className={styles.listItemTypeIcon} />;
        case 'Desarrollo personal': return <FaUserGraduate className={styles.listItemTypeIcon} />;
        case 'Relaciones': return <FaUsers className={styles.listItemTypeIcon} />;
        case 'Carrera profesional': return <FaBriefcase className={styles.listItemTypeIcon} />;
        default: return <FaRegDotCircle className={styles.listItemTypeIcon} />;
    }
};

function ObjetivoCard({ objective, isListItemStyle = false, onObjectiveDeleted }) {
    const navigate = useNavigate();

    const progressPercentage = objective.progreso_calculado !== undefined && objective.progreso_calculado !== null
        ? Math.round(objective.progreso_calculado)
        : 0;

    const lastUpdated = objective.updatedAt
        ? new Date(objective.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })
        : 'N/A';

    const handleCardClick = () => {
        navigate(`/objectives/${objective.id_objetivo}`);
    };

    if (isListItemStyle) {
        const objectiveTypeIcon = getObjectiveTypeIcon(objective.tipo_objetivo);
        return (
            <div
                className={styles.objetivoCardListItemStyle}
                onClick={handleCardClick}
                role="button"
                tabIndex="0"
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
                aria-label={`Ver detalles del objetivo ${objective.nombre}`}
            >
                <div className={styles.listItemIconContainer}>
                    {objectiveTypeIcon}
                </div>
                <div className={styles.listItemDetails}>
                    <h4 className={styles.listItemTitle}>{objective.nombre}</h4>
                    <p className={styles.listItemUpdateDate}>Actualizado: {lastUpdated}</p>
                </div>
                <div className={styles.listItemProgress}>
                    <span className={styles.listItemProgressText}>Progreso</span>
                    <span className={styles.listItemProgressPercentage}>{progressPercentage}%</span>
                </div>
                <button
                    className={styles.listItemArrowButton}
                    onClick={(e) => { e.stopPropagation(); handleCardClick();}}
                    aria-label={`Ver detalles de ${objective.nombre}`}
                >
                    <FaArrowRight />
                </button>
            </div>
        );
    }

    // Renderizado de la tarjeta detallada original
    const getCategoryIconOriginal = (category) => {
        switch (category) {
            case 'Salud': return <FaHeartbeat />;
            case 'Finanzas': return <FaPiggyBank />;
            case 'Desarrollo personal': return <FaUserGraduate />;
            case 'Relaciones': return <FaUsers />;
            case 'Carrera profesional': return <FaBriefcase />;
            default: return <FaStar />;
        }
    };

    let showProgressBar = false;
    let initialValue = NaN, targetValue = NaN, currentValue = NaN;
    let hasQuantitativeValues = false;
    const isPotentiallyQuantitative =
        objective.valor_inicial_numerico !== null && typeof objective.valor_inicial_numerico !== 'undefined' &&
        objective.valor_cuantitativo !== null && typeof objective.valor_cuantitativo !== 'undefined';

    if (isPotentiallyQuantitative) {
        initialValue = parseFloat(objective.valor_inicial_numerico);
        targetValue = parseFloat(objective.valor_cuantitativo);
        currentValue = (objective.valor_actual !== null && typeof objective.valor_actual !== 'undefined' && !isNaN(parseFloat(objective.valor_actual)))
            ? parseFloat(objective.valor_actual)
            : initialValue;
        if (!isNaN(initialValue) && !isNaN(targetValue) && !isNaN(currentValue)) hasQuantitativeValues = true;
    }

    let detailedProgressPercentage = 0;
    if (hasQuantitativeValues) {
        showProgressBar = true;
        if (initialValue === targetValue) {
            detailedProgressPercentage = (objective.es_menor_mejor ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
        } else {
            let totalRangeEffective = objective.es_menor_mejor ? initialValue - targetValue : targetValue - initialValue;
            let progressMadeEffective = objective.es_menor_mejor ? initialValue - currentValue : currentValue - initialValue;
            if (totalRangeEffective <= 0) detailedProgressPercentage = (objective.es_menor_mejor ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
            else detailedProgressPercentage = (progressMadeEffective / totalRangeEffective) * 100;
        }
        detailedProgressPercentage = Math.max(0, Math.min(100, detailedProgressPercentage));
    } else {
        showProgressBar = false;
    }
    if (objective.estado === 'Completado') {
        detailedProgressPercentage = 100;
        showProgressBar = true;
    } else if (objective.estado === 'Pendiente') {
        showProgressBar = hasQuantitativeValues;
    }
    const statusClassName = `status-${objective.estado?.toLowerCase().replace(/\s/g, '')}`;
    const lastUpdatedDetailed = objective.updatedAt ? new Date(objective.updatedAt).toLocaleDateString() : 'N/A'; // Para la tarjeta detallada

    return (
        <div className={styles.objetivoCard}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeaderContent}>
                    <h3 className={styles.cardTitle}>{objective.nombre}</h3>
                    <div className={styles.categoryBadge}>
                        <span className={styles.categoryBadgeIcon}>{getCategoryIconOriginal(objective.tipo_objetivo)}</span>
                        <span className={styles.categoryBadgeName}>{objective.tipo_objetivo}</span>
                    </div>
                </div>
                {objective.descripcion && <p className={styles.cardDescription}>{objective.descripcion}</p>}
                {showProgressBar && (
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>Progreso</span>
                            <span className={styles.progressPercentage}>{Math.round(detailedProgressPercentage)}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${
                                    detailedProgressPercentage < 33 ? styles.progressFillLow :
                                    detailedProgressPercentage < 66 ? styles.progressFillMedium :
                                    styles.progressFillHigh
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100,detailedProgressPercentage))}%` }}
                            ></div>
                        </div>
                    </div>
                )}
                {showProgressBar && hasQuantitativeValues && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Actual:</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(currentValue) ? (initialValue !== null && typeof initialValue !== 'undefined' && !isNaN(parseFloat(initialValue)) ? parseFloat(initialValue).toLocaleString() : 'N/A') : currentValue.toLocaleString()} {objective.unidad_medida || ''}
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
                    <FaCalendarAlt className={styles.dataIcon} />
                    <span className={styles.dataLabel}>Actualizado:</span>
                    <span className={styles.dataValue}>{lastUpdatedDetailed}</span>
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
                        <FaEdit className={styles.buttonIcon} />
                        Editar
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={handleCardClick}
                        aria-label={`Ver detalles del objetivo ${objective.nombre}`}
                    >
                        <FaEye className={styles.buttonIcon} />
                        Detalles
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ObjetivoCard;