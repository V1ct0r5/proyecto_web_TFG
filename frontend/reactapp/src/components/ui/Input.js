import React, { forwardRef } from 'react';
import styles from './Input.module.css';

// Componente genérico para inputs, textareas y selects
// Usa forwardRef para permitir que los padres (como react-hook-form) adjunten referencias a los elementos DOM nativos.
const Input = forwardRef(({
    type = 'text', // Tipo de input (text, email, password, number, textarea, select)
    id, // ID del input (necesario para el htmlFor del label en FormGroup)
    placeholder, // Texto del placeholder
    value, // Valor actual del input (controlado externamente, ej. por react-hook-form)
    onChange, // Función para manejar cambios (pasada por react-hook-form)
    onBlur, // Función para manejar el evento blur (pasada por react-hook-form)
    disabled, // Indica si el input está deshabilitado
    isError, // Indica si hay un error de validación (boolean)
    children, // Contenido para elementos select (opciones)
    className, // Clases CSS adicionales (si se necesitan)
    ...rest // Cualquier otra prop estándar del input (ej. step para number, min, max, etc.)
}, ref) => { // Recibe la referencia del padre

    let elementClass = styles.input; // Clase CSS por defecto para inputs
    let elementType = 'input'; // Tipo de elemento DOM por defecto

    // Determina la clase CSS y el tipo de elemento basado en el prop 'type'
    if (type === 'textarea') {
        elementClass = styles.textarea;
        elementType = 'textarea';
    } else if (type === 'select') {
        elementClass = styles.select;
        elementType = 'select';
    }
    // Si el tipo no es textarea o select, se mantiene 'input' y styles.input

    // Combina la clase base determinada con la clase de error si isError es true
    const inputClassName = isError
        ? `${elementClass} ${styles.error}` // Añade la clase de error
        : elementClass; // Solo usa la clase base

    // Si el elemento es un textarea, renderiza <textarea>
    if (elementType === 'textarea') {
        return (
            <textarea
                id={id}
                className={`${inputClassName} ${className || ''}`} // Combina clases base/error con clases adicionales
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur} // Pasa onBlur
                disabled={disabled}
                ref={ref} // Adjunta la referencia al elemento DOM nativo
                {...rest} // Pasa props restantes
            />
        );
    }

    // Si el elemento es un select, renderiza <select>
    if (elementType === 'select') {
        return (
            <select
                id={id}
                className={`${inputClassName} ${className || ''}`} // Combina clases
                value={value}
                onChange={onChange}
                onBlur={onBlur} // Pasa onBlur
                disabled={disabled}
                ref={ref} // Adjunta la referencia
                {...rest} // Pasa props restantes
            >
                {children}
            </select>
        );
    }

    // Si el elemento es un input (cualquier otro tipo), renderiza <input>
    return (
        <input
            type={type}
            id={id}
            className={`${inputClassName} ${className || ''}`} // Combina clases
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur} // Pasa onBlur
            disabled={disabled}
            ref={ref} // Adjunta la referencia
            {...rest} // Pasa props restantes
        />
    );
});

export default Input;