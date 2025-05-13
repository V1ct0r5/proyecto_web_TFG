// frontend/reactapp/src/components/ui/Input.js
import React from 'react';
import styles from './Input.module.css'; // Importar estilos específicos del input

// Componente de Input reutilizable
// Acepta todas las props estándar de un input HTML, incluyendo ref para usar con RHF
// El 'ref' se pasa usando React.forwardRef para que RHF pueda adjuntarlo al elemento DOM
const Input = React.forwardRef(({ className, ...props }, ref) => {
  const inputClasses = `${styles.input} ${className || ''}`;

  return (
    <input className={inputClasses} ref={ref} {...props} />
  );
});

// Renombrar para mejor depuración en React DevTools
Input.displayName = 'Input';

export default Input;