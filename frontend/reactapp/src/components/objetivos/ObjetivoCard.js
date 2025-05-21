import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
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
    let progressPercentage = 0;
    let showProgressBar = false;

    // Solo intentar calcular progreso si los valores cuantitativos existen y son números
    // Usamos el operador de encadenamiento opcional (?.) para evitar errores si la propiedad no existe
    const rawCurrentValue = objective.valor_actual;
    const rawTargetValue = objective.valor_cuantitativo;
    const isQuantitative = typeof rawCurrentValue !== 'undefined' && rawCurrentValue !== null &&
        typeof rawTargetValue !== 'undefined' && rawTargetValue !== null;

    if (isQuantitative) {
        const currentValue = parseFloat(rawCurrentValue);
        const targetValue = parseFloat(rawTargetValue);
        const isLowerBetter = objective.es_menor_mejor; // Esto también podría ser undefined, pero tu lógica lo maneja bien al ser un booleano

        if (!isNaN(currentValue) && !isNaN(targetValue) && targetValue > 0) {
            showProgressBar = true;

            if (isLowerBetter) {
                if (currentValue <= targetValue) {
                    progressPercentage = 100;
                } else {
                    progressPercentage = (targetValue / currentValue) * 100;
                }
                progressPercentage = Math.min(progressPercentage, 100);
            } else {
                progressPercentage = (currentValue / targetValue) * 100;
                progressPercentage = Math.min(progressPercentage, 100);
            }
        }
    }

    // Si el objetivo está marcado como 'Completado' y no es cuantitativo, o incluso siéndolo
    // queremos que la barra siempre muestre 100% si el estado es 'Completado'.
    // Esto sobrescribe el cálculo anterior si el objetivo ya se ha completado.
    if (objective.estado === 'Completado') {
        progressPercentage = 100;
        showProgressBar = true; // Asegúrate de que la barra se muestre si está completado
    }


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

                {/* Renderiza la barra de progreso solo si showProgressBar es true */}
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

                {/* Muestra los valores actuales y meta si la barra de progreso es visible Y es un objetivo cuantitativo */}
                {showProgressBar && isQuantitative && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Actual:</div>
                            <div className={styles.progressValueNumber}>
                                {parseFloat(rawCurrentValue)} {objective.unidad_medida || ''}
                            </div>
                        </div>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>Meta:</div>
                            <div className={styles.progressValueNumber}>
                                {parseFloat(rawTargetValue)} {objective.unidad_medida || ''}
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
                    >
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