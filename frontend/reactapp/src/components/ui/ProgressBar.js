// frontend/reactapp/src/components/ui/ProgressBar.js
import React from 'react';
import styles from './ProgressBar.module.css';
import { FaChartLine, FaArrowDown, FaMinus } from 'react-icons/fa';

const ProgressBar = ({ percentage }) => {
    // Asegura que el porcentaje esté entre 0 y 100
    const clampedPercentage = Math.max(0, Math.min(100, parseFloat(percentage) || 0));

    let progressStatusText;
    let StatusIconComponent;
    let progressFillColor;

    // Define el texto, icono y color de la barra según el porcentaje de progreso
    if (clampedPercentage >= 75) {
        progressStatusText = "Excelente progreso";
        StatusIconComponent = <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />;
        progressFillColor = 'var(--progress-excellent, #20c997)'; // Verde brillante
    } else if (clampedPercentage >= 50) {
        progressStatusText = "Buen progreso";
        StatusIconComponent = <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />;
        progressFillColor = 'var(--progress-good, #28a745)'; // Verde
    } else if (clampedPercentage >= 25) {
        progressStatusText = "Progreso regular";
        StatusIconComponent = <FaMinus className={`${styles.statusIcon} ${styles.iconNeutral}`} />;
        progressFillColor = 'var(--progress-regular, #6f42c1)'; // Morado
    } else if (clampedPercentage > 0){
        progressStatusText = "Mal progreso";
        StatusIconComponent = <FaArrowDown className={`${styles.statusIcon} ${styles.iconDown}`} />;
        progressFillColor = 'var(--progress-poor, #ffc107)'; // Naranja/Amarillo
    } else { // clampedPercentage es 0
        progressStatusText = "Sin progreso";
        StatusIconComponent = <FaMinus className={`${styles.statusIcon} ${styles.iconNeutral}`} />;
        progressFillColor = 'var(--progress-none, #6c757d)'; // Gris
    }
    
    return (
        <div className={styles.progressBarContainer}>
            <div className={styles.progressBarTrack}> {/* Fondo que representa el 100% */}
                <div 
                    className={styles.progressBarFill} 
                    style={{ 
                        width: `${clampedPercentage}%`,
                        backgroundColor: progressFillColor // Aplica color dinámico según el progreso
                    }}
                >
                </div>
            </div>
            <div className={styles.progressLabels}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
            {progressStatusText && (
                <div className={styles.statusText}>
                    {StatusIconComponent}
                    <span>{progressStatusText}</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;