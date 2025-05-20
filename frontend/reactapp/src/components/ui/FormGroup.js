import React from 'react';
import styles from './FormGroup.module.css';

// Componente genérico para agrupar un label, un input y un mensaje de error
// Esto ayuda a estandarizar la estructura de los campos de formulario.
function FormGroup({
    label, // Texto de la etiqueta (string)
    htmlFor, // El 'id' del input asociado (string)
    required, // Indica si el campo es obligatorio (boolean)
    error, // Mensaje de error de validación a mostrar (string o null/undefined)
    children // El/los elementos input, select, textarea u otro control de formulario (nodos React)
}) {
    return (
        <div className={styles.formGroup}>
            <label htmlFor={htmlFor} className={styles.formLabel}>
                {label}
                {required && <span className={styles.formRequired}>*</span>}
            </label>
            {children}
            {error && <p className={styles.formErrorInline}>{error}</p>}
        </div>
    );
}

export default FormGroup;