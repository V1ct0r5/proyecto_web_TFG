// frontend/reactapp/src/components/ui/FormGroup.js
import React from 'react';
import styles from './FormGroup.module.css'; // Importar estilos específicos del form group

// Componente para agrupar un label, un campo de formulario y un mensaje de error inline
function FormGroup({ label, htmlFor, required, error, children }) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={htmlFor} className={styles.formLabel}>
        {label}
        {required && <span className={styles.formRequired}>*</span>} {/* Indicador de requerido */}
      </label>
      {children}
      {error && <p className={styles.formErrorInline}>{error}</p>} {/* Mensaje de error inline */}
    </div>
  );
}

export default FormGroup;