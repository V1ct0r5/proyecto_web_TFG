import React, { useMemo } from 'react';
import styles from './ProgressBar.module.css';
import { FaChartLine, FaArrowDown, FaMinus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({ percentage }) => {
    const { t } = useTranslation();
    const clampedPercentage = Math.max(0, Math.min(100, parseFloat(percentage) || 0));

    // Lógica para determinar el texto, el icono y la CLASE CSS del estado
    const { statusText, StatusIcon, statusClass } = useMemo(() => {
        if (clampedPercentage >= 75) {
            return {
                statusText: t('progressBar.excellent'),
                StatusIcon: <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />,
                statusClass: styles.excellent,
            };
        }
        if (clampedPercentage >= 50) {
            return {
                statusText: t('progressBar.good'),
                StatusIcon: <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />,
                statusClass: styles.good,
            };
        }
        if (clampedPercentage >= 25) {
            return {
                statusText: t('progressBar.regular'),
                StatusIcon: <FaMinus className={`${styles.statusIcon} ${styles.iconNeutral}`} />,
                statusClass: styles.regular,
            };
        }
        return {
            statusText: t('progressBar.poor'),
            StatusIcon: <FaArrowDown className={`${styles.statusIcon} ${styles.iconDown}`} />,
            statusClass: styles.poor,
        };
    }, [clampedPercentage, t]);
    
    return (
        <div className={styles.progressBarContainer}>
            <div className={styles.progressBarTrack}>
                <div 
                    // Se aplica la clase de estado directamente
                    className={`${styles.progressBarFill} ${statusClass}`} 
                    style={{ width: `${clampedPercentage}%` }}
                />
            </div>
            <div className={styles.progressLabels}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
            {statusText && (
                <div className={styles.statusText}>
                    {StatusIcon}
                    <span>{statusText}</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;