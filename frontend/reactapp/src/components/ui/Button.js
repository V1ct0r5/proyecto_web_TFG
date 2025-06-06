// frontend/reactapp/src/components/ui/Button.js
import React from 'react';
import styles from './Button.module.css'; // Asegúrate que la ruta es correcta
import { useTranslation } from 'react-i18next';
// Opcional: import LoadingSpinner from './LoadingSpinner'; // Si quieres un spinner dentro del botón

const Button = ({
    children,
    className = '',    // Clase externa
    variant = 'primary', // Prop para el estilo visual (ej. 'primary', 'secondary', 'ghost')
    size = 'medium',     // Prop para el tamaño (ej. 'small', 'medium', 'large')
    isLoading = false,   // Prop para el estado de carga
    disabled = false,    // Prop para el estado deshabilitado
    type = 'button',     // Prop para el tipo de botón HTML
    onClick,             // Prop para el manejador de clic
    leftIcon,            // Prop opcional para un icono a la izquierda
    rightIcon,           // Prop opcional para un icono a la derecha
    ...rest              // Recoge cualquier otra prop estándar de HTML button (ej. aria-label, id)
}) => {
    const { t } = useTranslation();

    // Construye las clases CSS de forma dinámica
    const buttonClasses = [
        styles.button,                      // Clase base
        styles[variant] || styles.primary,  // Clase de variante (con fallback)
        styles[size] || styles.medium,      // Clase de tamaño (con fallback)
        isLoading ? styles.loading : '',    // Clase opcional si está cargando
        className                           // Clases externas pasadas como prop
    ].filter(Boolean).join(' ').trim();     // filter(Boolean) para eliminar clases vacías y trim para espacios

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || isLoading} // El botón se deshabilita si su prop 'disabled' es true o si 'isLoading' es true
            {...rest}
        >
            {isLoading ? (
                <>
                    <span className={styles.loadingText}>{t('loaders.loadingSimple')}</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;