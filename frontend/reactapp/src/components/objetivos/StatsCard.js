// frontend/reactapp/src/components/objetivos/StatsCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './StatsCard.module.css'; 
import { FaArrowRight } from 'react-icons/fa';

const StatsCard = ({ 
    title,          // Título principal de la tarjeta
    value,          // Valor principal (puede ser string, número o JSX)
    valueDescription, // Descripción corta que acompaña al valor (ej. "objetivos", "en total")
    details,        // Texto de detalle simple (se muestra si no hay 'children')
    linkTo,         // URL para el enlace inferior
    icon,           // Elemento JSX para el icono principal (opcional)
    linkText = "Ver detalles", // Texto para el enlace inferior
    children        // Contenido JSX anidado para información más compleja (ej. gráficos, listas)
}) => {
    return (
        <div className={styles.statsCard}>
            {icon && <div className={styles.iconWrapper}>{icon}</div>}

            <div className={styles.contentWrapper}>
                {title && <h3 className={styles.title}>{title}</h3>}

                {/* Renderiza el valor principal, ya sea texto/número o un elemento JSX */}
                {(typeof value === 'string' || typeof value === 'number') ? (
                    <p className={styles.value}>{value}</p>
                ) : (
                    value 
                )}

                {valueDescription && <span className={styles.valueDescription}>{valueDescription}</span>}

                {/* Muestra detalles simples si se proporcionan y no hay contenido 'children' */}
                {details && !children && <p className={styles.details}>{details}</p>}

                {/* Contenedor para contenido anidado más complejo (ej. gráficos, listas) */}
                {children && <div className={styles.childrenContainer}>{children}</div>}
            </div>

            {linkTo && (
                <Link to={linkTo} className={styles.link}>
                    {linkText} <FaArrowRight size="0.8em" />
                </Link>
            )}
        </div>
    );
};

export default StatsCard;