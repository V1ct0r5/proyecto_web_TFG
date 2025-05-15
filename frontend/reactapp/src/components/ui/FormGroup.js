// frontend/reactapp/src/components/ui/FormGroup.js
import React from 'react';
import styles from './FormGroup.module.css';
function FormGroup({ label, htmlFor, required, error, children }) {
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