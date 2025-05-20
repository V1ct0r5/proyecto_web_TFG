import React from 'react';
import styles from './ObjetivoCard.module.css';

// Importa los iconos de react-icons/md que se utilizan en el componente
import {
    MdFavorite, // Salud
    MdAttachMoney, // Finanzas
    MdAutoStories, // Desarrollo personal
    MdPeople, // Relaciones
    MdWork, // Carrera profesional
    MdStar, // Otros o por defecto
    MdCalendarToday, // Fecha
    MdEdit, // Editar
    MdOutlineRemoveRedEye // Detalles
} from 'react-icons/md';


// Componente para mostrar una tarjeta individual de objetivo
function ObjetivoCard({ objective }) {

    // Función para obtener el icono de Material Design basado en el tipo de objetivo
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Salud':
                return <MdFavorite />;
            case 'Finanzas':
                return <MdAttachMoney />;
            case 'Desarrollo personal':
                return <MdAutoStories />;
            case 'Relaciones':
                return <MdPeople />;
            case 'Carrera profesional':
                return <MdWork />;
            default: // Caso por defecto para 'Otros' o tipos no reconocidos
                return <MdStar />;
        }
    };

    // Lógica para calcular el progreso y determinar si mostrar la barra
    // Usa valor_actual y valor_cuantitativo (meta) del objeto objective
    const currentValue = objective.valor_actual || 0; // Usa 0 si valor_actual es null/undefined
    const targetValue = objective.valor_cuantitativo;

    let progressPercentage = 0;
    let showProgressBar = false;

    // Calcula el porcentaje de progreso si los valores cuantitativos son números válidos y la meta es mayor que 0
    if (typeof currentValue === 'number' && typeof targetValue === 'number' && targetValue > 0) {
        progressPercentage = Math.min((currentValue / targetValue) * 100, 100); // Limita el porcentaje a 100
        showProgressBar = true; // Muestra la barra de progreso
    } else if (objective.estado === 'Completado') {
        // Si el estado es "Completado", la barra de progreso siempre está al 100%
        progressPercentage = 100;
        showProgressBar = true;
    }
    // Si no hay valores cuantitativos válidos y el estado no es "Completado", showProgressBar seguirá siendo false (inicial)

    // Formatea la fecha de última actualización
    const lastUpdated = objective.updatedAt ? new Date(objective.updatedAt).toLocaleDateString() : 'N/A';

    // Genera un nombre de clase dinámico para el estado (ej. 'status-pendiente', 'status-enprogreso')
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
                        <div className={styles.progressBar}> {/* Barra visual de progreso */}
                            <div
                                className={`${styles.progressFill} ${progressPercentage < 33 ? styles.progressFillLow : progressPercentage < 66 ? styles.progressFillMedium : styles.progressFillHigh}`}
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {showProgressBar && typeof currentValue === 'number' && typeof targetValue === 'number' && targetValue > 0 && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Actual:</div>
                            <div className={styles.progressValueNumber}>
                                {currentValue} {objective.unidad_medida || ''}
                            </div>
                        </div>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Meta:</div>
                            <div className={styles.progressValueNumber}>
                                {targetValue} {objective.unidad_medida || ''}
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
                    <button className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}>
                        <MdEdit className={styles.buttonIcon} />
                        Editar
                    </button>
                    <button className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}>
                        <MdOutlineRemoveRedEye className={styles.buttonIcon} />
                        Detalles
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ObjetivoCard;