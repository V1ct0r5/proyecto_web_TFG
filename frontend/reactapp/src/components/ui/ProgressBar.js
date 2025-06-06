import React from 'react';
import styles from './ProgressBar.module.css';
import { FaChartLine, FaArrowDown, FaMinus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({ percentage }) => {
    const { t } = useTranslation();
    const clampedPercentage = Math.max(0, Math.min(100, parseFloat(percentage) || 0));

    let progressStatusText;
    let StatusIconComponent;
    let progressFillColor;

    if (clampedPercentage >= 75) {
        progressStatusText = t('progressBar.excellent');
        StatusIconComponent = <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />;
        progressFillColor = 'var(--progress-excellent, #20c997)';
    } else if (clampedPercentage >= 50) {
        progressStatusText = t('progressBar.good');
        StatusIconComponent = <FaChartLine className={`${styles.statusIcon} ${styles.iconUp}`} />;
        progressFillColor = 'var(--progress-good, #28a745)';
    } else if (clampedPercentage >= 25) {
        progressStatusText = t('progressBar.regular');
        StatusIconComponent = <FaMinus className={`${styles.statusIcon} ${styles.iconNeutral}`} />;
        progressFillColor = 'var(--progress-regular, #6f42c1)';
    } else if (clampedPercentage > 0){
        progressStatusText = t('progressBar.poor');
        StatusIconComponent = <FaArrowDown className={`${styles.statusIcon} ${styles.iconDown}`} />;
        progressFillColor = 'var(--progress-poor, #ffc107)';
    } else {
        progressStatusText = t('progressBar.none');
        StatusIconComponent = <FaMinus className={`${styles.statusIcon} ${styles.iconNeutral}`} />;
        progressFillColor = 'var(--progress-none, #6c757d)';
    }
    
    return (
        <div className={styles.progressBarContainer}>
            <div className={styles.progressBarTrack}>
                <div 
                    className={styles.progressBarFill} 
                    style={{ 
                        width: `${clampedPercentage}%`,
                        backgroundColor: progressFillColor
                    }}
                >
                </div>
            </div>
            <div className={styles.progressLabels}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
            {progressStatusText && (
                <div className={styles.statusText}>
                    {StatusIconComponent}
                    <span>{progressStatusText}</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;