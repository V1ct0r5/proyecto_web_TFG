import React from 'react';
import { Link } from 'react-router-dom';
import styles from './StatsCard.module.css';
import { FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const StatsCard = ({
    title,
    value,
    valueDescription,
    details,
    linkTo,
    icon,
    linkText,
    children,
    decimalPlacesToShow,
}) => {
    const { t } = useTranslation();
    let displayValue = value;

    if (typeof value === 'number' && decimalPlacesToShow !== undefined && decimalPlacesToShow !== null) {
        const places = Math.max(0, Math.floor(decimalPlacesToShow));
        displayValue = value.toFixed(places);
    }

    return (
        <div className={styles.statsCard}>
            {icon && <div className={styles.iconWrapper}>{icon}</div>}

            <div className={styles.contentWrapper}>
                {title && <h3 className={styles.title}>{title}</h3>}
                {(typeof displayValue === 'string' || typeof displayValue === 'number') ? (
                    <p className={styles.value}>{displayValue}</p>
                ) : (
                    value 
                )}
                {valueDescription && <span className={styles.valueDescription}>{valueDescription}</span>}
                {details && !children && <p className={styles.details}>{details}</p>}
                
                {/* Esta línea es clave: renderiza el gráfico en su contenedor */}
                {children && <div className={styles.childrenContainer}>{children}</div>}
            </div>

            {linkTo && (
                <Link to={linkTo} className={styles.link}>
                    {linkText || t('statsCard.viewDetails')} <FaArrowRight size="0.8em" />
                </Link>
            )}
        </div>
    );
};

export default StatsCard;