import React from 'react';
import styles from './Button.module.css'; // Importa los estilos como un módulo CSS

// Componente genérico de botón
// Recibe children (el contenido del botón), className (clases CSS adicionales)
// y ...props para pasar cualquier otra prop estándar de botón (ej. type, onClick, disabled)
function Button({ children, className, ...props }) {

    // Combina la clase base del módulo CSS con cualquier clase adicional pasada como prop
    // Esto permite usar estilos específicos del módulo (ej. styles.buttonPrimary)
    // y añadir clases de utilidad o de otros módulos si es necesario.
    const buttonClasses = `${styles.button} ${className || ''}`;

    // Renderiza un elemento <button> con las clases combinadas y todas las props restantes
    return (
        <button className={buttonClasses} {...props}>
            {children} {/* Renderiza el contenido dentro del botón */}
        </button>
    );
}

export default Button;