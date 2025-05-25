import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'; // Importa los estilos CSS de la librería

function GoalProgressChart({ progressPercentage }) {
    return (
        <div style={{ width: '150px', height: '150px', margin: '0 auto 1.5rem auto' }}>
            <CircularProgressbar
                value={progressPercentage} // El valor del progreso (0-100)
                text={`${Math.round(progressPercentage)}%`} // Texto que se muestra en el centro (ej. "64%")
                styles={buildStyles({
                    // Color del texto central
                    textColor: '#27ae60', // Un verde vivo similar al de tu imagen
                    // Color de la parte "rellena" del círculo (el progreso)
                    pathColor: '#27ae60', // Mismo verde
                    // Color de la parte "vacía" del círculo (el fondo)
                    trailColor: '#f2f4f6', // Un gris muy claro para el fondo, como en la imagen
                    // Duración de la animación de transición al cambiar el valor
                    pathTransitionDuration: 0.5,
                    // Fuente del texto si quieres personalizarla (requiere que la fuente esté disponible)
                    // textFamily: 'Inter, sans-serif',
                })}
            />
        </div>
    );
}

export default GoalProgressChart;