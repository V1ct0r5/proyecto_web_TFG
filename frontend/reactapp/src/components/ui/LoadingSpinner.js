import React from 'react';
import styles from './LoadingSpinner.module.css';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ 
    size = 'medium', 
    color = 'primary', 
    className = '', 
    style = {}, 
    text 
}) => {
    const { t } = useTranslation();
    const sizeClass = styles[size] || styles.medium;
    const colorClass = styles[color] || styles.primary;

    return (
        <div className={`${styles.spinnerContainer} ${className}`} style={style}>
            <div 
                className={`${styles.spinner} ${sizeClass} ${colorClass}`}
                role="status"
                aria-live="polite"
            >
                <span className="sr-only">{t('loaders.loadingSimple')}</span>
            </div>
            {text && <span className={styles.spinnerText}>{text}</span>}
        </div>
    );
};

export default LoadingSpinner;