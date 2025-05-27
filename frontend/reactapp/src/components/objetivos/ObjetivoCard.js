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
            case 'Carrera profesional': return <MdWork />; // Asegurar que coincida con el valor exacto
            default: return <MdStar />;
        }
    };

    let progressPercentage = 0;
    let showProgressBar = false;

    // Convertir a números y manejar valores nulos/indefinidos con fallback a 0
    const initialValue = parseFloat(objective.valor_inicial_numerico) || 0;
    const targetValue = parseFloat(objective.valor_cuantitativo) || 0;
    // currentValue puede ser NaN si objective.valor_actual no es numérico o es null/undefined
    let currentValue = parseFloat(objective.valor_actual); 

    const isLowerBetter = objective.es_menor_mejor;

    // Determinar si el objetivo es cuantitativo y tiene valores válidos para calcular el progreso
    const hasQuantitativeValues =
        typeof objective.valor_inicial_numerico !== 'undefined' && objective.valor_inicial_numerico !== null &&
        typeof objective.valor_cuantitativo !== 'undefined' && objective.valor_cuantitativo !== null &&
        typeof objective.valor_actual !== 'undefined' && objective.valor_actual !== null && // valor_actual debe existir
        !isNaN(initialValue) && // Y los valores parseados deben ser números
        !isNaN(targetValue) &&
        !isNaN(currentValue);

    if (hasQuantitativeValues) {
        showProgressBar = true;

        if (initialValue === targetValue) {
            // Si el objetivo es alcanzar un valor específico (ej. initial=50, target=50)
            progressPercentage = (currentValue === targetValue) ? 100 : 0;
        } else {
            let totalRange;
            let progressMade;

            if (isLowerBetter) { // Menor es mejor (ej. de 100 a 50)
                totalRange = initialValue - targetValue; // Rango positivo
                progressMade = initialValue - currentValue; // Cuánto se ha "reducido" desde el inicio
            } else { // Mayor es mejor (ej. de 50 a 100)
                totalRange = targetValue - initialValue; // Rango positivo
                progressMade = currentValue - initialValue; // Cuánto se ha "incrementado" desde el inicio
            }

            if (totalRange === 0) { 
                // Este caso ya está cubierto por initialValue === targetValue, pero como salvaguarda.
                progressPercentage = (isLowerBetter ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
            } else {
                // El progreso es la proporción del avance logrado dentro del rango total.
                // Math.min asegura que no se exceda el 100% si se supera el objetivo.
                // Math.max asegura que no sea negativo si se retrocede más allá del inicio.
                progressPercentage = (Math.max(0, Math.min(progressMade, totalRange)) / totalRange) * 100;
            }
        }
        // Asegurar que el porcentaje final esté estrictamente entre 0 y 100.
        progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    } else {
        // No es cuantitativo o faltan valores críticos
        showProgressBar = false;
        progressPercentage = 0;
    }

    // La lógica del estado tiene la última palabra sobre el progreso y visibilidad de la barra.
    if (objective.estado === 'Completado') {
        progressPercentage = 100;
        showProgressBar = true; // Un objetivo completado siempre muestra su barra al 100% si es cuantitativo o no
    } else if (objective.estado === 'Pendiente') {
        progressPercentage = 0;
        // Para objetivos pendientes, mostrar la barra si es cuantitativo (incluso si está en 0%)
        // Si no es cuantitativo, no mostrar la barra.
        showProgressBar = hasQuantitativeValues;
    }
    // Para "En Progreso", se usa el progressPercentage calculado y showProgressBar ya definido.
    // Para "Fallido" o "Archivado", se usa el progressPercentage calculado y showProgressBar.

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
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {showProgressBar && hasQuantitativeValues && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Actual:</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(currentValue) ? 'N/A' : currentValue.toLocaleString()} {objective.unidad_medida || ''}
                            </div>
                        </div>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Meta:</div>
                            <div className={styles.progressValueNumber}>
                                {targetValue.toLocaleString()} {objective.unidad_medida || ''}
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