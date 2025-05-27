// frontend/reactapp/src/components/ui/LoadingSpinner.js
import React from 'react';
import styles from './LoadingSpinner.module.css'; // Importamos los CSS Modules

/**
 * LoadingSpinner Component
 * Muestra un indicador visual de carga.
 * @param {object} props - Propiedades del componente.
 * @param {string} [props.size='medium'] - Tamaño del spinner ('small', 'medium', 'large').
 * @param {string} [props.color='primary'] - Color del spinner ('primary', 'secondary', 'white', etc. según tu CSS).
 * @param {string} [props.className] - Clases CSS adicionales para personalizar el contenedor.
 * @param {object} [props.style] - Estilos en línea adicionales para el contenedor.
 * @param {string} [props.text] - Texto opcional para mostrar junto al spinner.
 */
const LoadingSpinner = ({ 
    size = 'medium', 
    color = 'primary', 
    className = '', 
    style = {}, 
    text 
}) => {
    const sizeClass = styles[size] || styles.medium; // Fallback a 'medium' si el tamaño no es válido
    const colorClass = styles[color] || styles.primary; // Fallback a 'primary' si el color no es válido

    return (
        <div className={`${styles.spinnerContainer} ${className}`} style={style}>
            <div 
                className={`${styles.spinner} ${sizeClass} ${colorClass}`}
                role="status" // Mejorar accesibilidad
                aria-live="polite" // Mejorar accesibilidad
            >
                <span className="sr-only">Cargando...</span> {/* Texto para lectores de pantalla */}
            </div>
            {text && <span className={styles.spinnerText}>{text}</span>}
        </div>
    );
};

export default LoadingSpinner;