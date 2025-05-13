// frontend/reactapp/src/components/ui/Button.js
import React from 'react';
import styles from './Button.module.css'; // Importar estilos específicos del botón

// Componente de botón reutilizable
// Acepta todas las props estándar de un botón HTML, además de children
function Button({ children, className, ...props }) {

    const buttonClasses = `${styles.button} ${className || ''}`;

    return (
        <button className={buttonClasses} {...props}>
        {children} {/* El texto o contenido del botón */}
        </button>
    );
}

export default Button;