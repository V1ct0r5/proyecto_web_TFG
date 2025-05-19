import React from 'react';
import styles from './ObjetivoCard.module.css';

import { MdFavorite, MdAttachMoney, MdAutoStories, MdPeople, MdWork, MdStar, MdCalendarToday, MdEdit, MdOutlineRemoveRedEye } from 'react-icons/md';


function ObjetivoCard({ objective }) {
    console.log("Datos del objetivo recibidos:", objective);
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
            default:
                return <MdStar />;
        }
    };

    // <-- Corrección aquí: Usar valor_actual para el valor actual y valor_cuantitativo para la meta -->
    const currentValue = objective.valor_actual || 0;
    const targetValue = objective.valor_cuantitativo;

    let progressPercentage = 0;
    let showProgressBar = false;

    if (typeof currentValue === 'number' && typeof targetValue === 'number' && targetValue > 0) {
        progressPercentage = Math.min((currentValue / targetValue) * 100, 100);
        showProgressBar = true;
    } else if (objective.estado === 'Completado') {
        progressPercentage = 100;
        showProgressBar = true;
    }


    const lastUpdated = objective.updatedAt ? new Date(objective.updatedAt).toLocaleDateString() : 'N/A';

    const statusClassName = `status-${objective.estado.toLowerCase().replace(/\s/g, '')}`;


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
                                className={`${styles.progressFill} ${styles.progressFillHigh}`}
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