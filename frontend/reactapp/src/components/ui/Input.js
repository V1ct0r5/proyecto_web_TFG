// frontend/reactapp/src/components/ui/Input.js
import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
    type = 'text',
    id,
    placeholder,
    value,
    onChange,
    onBlur,
    disabled,
    isError,
    children,        // Para <select>
    className,       // Clases CSS adicionales para el input/select/textarea en sí
    wrapperClassName = '', // Clases CSS adicionales para el div contenedor
    actionIcon,          // Prop para el icono de acción
    onActionClick,       // Prop para el manejador de clic del icono de acción
    actionIconAriaLabel, // NUEVA PROP: para el aria-label del botón de acción
    ...rest              // Props restantes
}, ref) => {

    let elementClass = styles.input;
    let elementType = 'input';
    let specificInputType = type;

    if (type === 'textarea') {
        elementClass = styles.textarea;
        elementType = 'textarea';
    } else if (type === 'select') {
        elementClass = styles.select;
        elementType = 'select';
    }

    const finalInputClassName = `${elementClass} ${isError ? styles.error : ''} ${className || ''}`.trim();
    const finalWrapperClassName = `${styles.inputWrapper} ${wrapperClassName || ''}`.trim(); // Asegúrate que styles.inputWrapper exista

    const inputElement = () => {
        if (elementType === 'textarea') {
            return (
                <textarea
                    id={id}
                    className={finalInputClassName}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    ref={ref}
                    {...rest}
                />
            );
        }

        if (elementType === 'select') {
            return (
                <select
                    id={id}
                    className={finalInputClassName}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    ref={ref}
                    {...rest}
                >
                    {children}
                </select>
            );
        }

        return (
            <input
                type={specificInputType}
                id={id}
                className={finalInputClassName}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                ref={ref}
                {...rest}
            />
        );
    };

    return (
        <div className={finalWrapperClassName}>
            {inputElement()}
            {actionIcon && onActionClick && (
                <button
                    type="button"
                    onClick={onActionClick}
                    className={styles.actionIconButton} // Asegúrate que styles.actionIconButton exista
                    aria-label={actionIconAriaLabel || "Realizar acción del input"} // Usar la nueva prop o un fallback
                    disabled={disabled}
                >
                    {actionIcon}
                </button>
            )}
        </div>
    );
});

export default Input;