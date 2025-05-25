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

    // --- Lógica para calcular el progreso ---
    let progressPercentage = 0;
    let showProgressBar = false;

    // Obtener valores brutos del objetivo. Asegúrate de que estos vengan del backend.
    const rawCurrentValue = objective.valor_actual;
    const rawTargetValue = objective.valor_cuantitativo;
    const rawInitialValue = objective.valor_inicial_numerico; // Este es crucial

    // Verificar si el objetivo tiene los datos cuantitativos necesarios para mostrar una barra de progreso.
    const isQuantitative = (
        typeof rawCurrentValue !== 'undefined' && rawCurrentValue !== null &&
        typeof rawTargetValue !== 'undefined' && rawTargetValue !== null &&
        typeof rawInitialValue !== 'undefined' && rawInitialValue !== null
    );


    if (isQuantitative) {
        const initialValue = parseFloat(rawInitialValue);
        const targetValue = parseFloat(rawTargetValue);
        let currentValue = parseFloat(rawCurrentValue);
        const isLowerBetter = objective.es_menor_mejor;

        if (objective.estado === 'En Progreso') {
            // Si valor_actual no es un número válido (ej. null, undefined, '', 'abc'),
            // o si es 0 cuando initialValue no lo es (y no es el target),
            // se asume que el valor actual es el valor inicial para el cálculo de progreso.
            // Esto es para objetivos recién creados sin actualización.
            if (isNaN(currentValue) || (currentValue === 0 && initialValue !== 0 && initialValue !== null && initialValue !== undefined && initialValue !== targetValue)) {
                currentValue = initialValue;
            }
        }


        // Si todos los valores clave son números válidos, podemos calcular el progreso.
        if (!isNaN(initialValue) && !isNaN(targetValue) && !isNaN(currentValue)) {
            showProgressBar = true;

            if (isLowerBetter) { // Escenario: Menor es mejor (ej. bajar de 600 a 500)
                if (initialValue <= targetValue) {
                    progressPercentage = (currentValue <= targetValue) ? 100 : 0;
                } else {
                    const totalRange = initialValue - targetValue; // 600 - 500 = 100
                    const progressMade = initialValue - currentValue;
                    if (totalRange === 0) { // Evitar división por cero si initial y target son iguales
                        progressPercentage = (currentValue <= targetValue) ? 100 : 0;
                    } else {
                        // Aseguramos que progressMade no sea negativo si el valor actual subió (ej. 600 a 650)
                        progressPercentage = (Math.max(0, progressMade) / totalRange) * 100;
                    }
                }
            } else { // Escenario: Mayor es mejor (ej. subir de 100 a 200)
                if (initialValue >= targetValue) {
                    // Si el valor inicial ya está en o por encima del objetivo,
                    // el progreso es 100% si el current está en o por encima del target, 0% si empeora.
                    progressPercentage = (currentValue >= targetValue) ? 100 : 0;
                } else {
                    // Cálculo normal: targetValue (200) > initialValue (100)
                    const totalRange = targetValue - initialValue; // 200 - 100 = 100
                    const progressMade = currentValue - initialValue;

                    if (totalRange === 0) { // Evitar división por cero si initial y target son iguales
                        progressPercentage = (currentValue >= targetValue) ? 100 : 0;
                    } else {
                        // Aseguramos que progressMade no sea negativo si el valor actual bajó (ej. 100 a 50)
                        progressPercentage = (Math.max(0, progressMade) / totalRange) * 100;
                    }
                }
            }


            if (objective.estado === 'En Progreso' && currentValue === initialValue && initialValue !== targetValue) {
                progressPercentage = 0;
            }
        }
    }

    // Asegurarse de que el porcentaje de progreso esté siempre entre 0 y 100.
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));


    // Si el objetivo está marcado como 'Completado', forzamos el progreso al 100%
    // y nos aseguramos de que la barra se muestre, sobrescribiendo cualquier cálculo anterior.
    if (objective.estado === 'Completado') {
        progressPercentage = 100;
        showProgressBar = true;
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
                                {/* Mostramos el rawCurrentValue aquí para reflejar el valor original del backend */}
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
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={() => navigate(`/objectives/${objective.id_objetivo}`)}
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