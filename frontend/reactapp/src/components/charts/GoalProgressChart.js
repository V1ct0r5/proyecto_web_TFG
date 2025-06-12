// frontend/reactapp/src/components/charts/GoalProgressChart.js
import React from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import styles from './GoalProgressChart.module.css'; // Importamos nuestro CSS Module

/**
 * Muestra un gráfico de progreso circular.
 * @param {number} progressPercentage - El valor del progreso (0-100).
 */
function GoalProgressChart({ progressPercentage }) {
    const percentage = Math.round(progressPercentage || 0);

    return (
        <div className={styles.chartContainer}>
            <CircularProgressbar
                value={percentage}
                text={`${percentage}%`}
                // Los estilos ahora se controlan vía CSS para adaptarse al tema
                className={styles.themedCircularProgressbar}
                strokeWidth={8}
            />
        </div>
    );
}

export default GoalProgressChart;