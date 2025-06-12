// frontend/reactapp/src/components/objetivos/ObjetivoCard.js
import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/apiService';

// Utilidades y Componentes UI
import { getCategoryIcon, getStatusInfo } from '../../utils/ObjectiveUtils';
import Button from '../ui/Button';
import { FaEdit, FaEye, FaArchive, FaCalendarAlt } from 'react-icons/fa'; // Import FaCalendarAlt
import { formatDateByPreference } from '../../utils/dateUtils'; // Import formatDateByPreference
import { useSettings } from '../../context/SettingsContext'; // Import useSettings

/**
 * Muestra una tarjeta de resumen para un objetivo.
 * @param {object} objective - El objeto del objetivo con datos.
 * @param {function} onObjectiveArchived - Callback que se ejecuta cuando el objetivo es archivado exitosamente.
 */
function ObjetivoCard({ objective, onObjectiveArchived }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { settings } = useSettings(); // Use settings for date formatting

    // El servicio ya nos da el progreso calculado, solo lo redondeamos.
    const progressPercentage = Math.round(objective.progressPercentage || 0);

    // Obtenemos la información de estado (traducción y clase CSS) desde la utilidad.
    const { translatedStatus, statusClassName } = getStatusInfo(objective.status, t);
console.log('Status Class Name:', statusClassName);

    // Determine if objective has quantifiable values (initialValue, targetValue, currentValue)
    // The objective object passed from backend should now have `initialValue`, `targetValue`, `currentValue` from the service
    // and `unit` for measurement unit.
    const hasQuantitativeValues = objective.initialValue != null && objective.targetValue != null;

    const currentValueDisplay = hasQuantitativeValues && objective.currentValue != null
        ? `${objective.currentValue.toLocaleString(settings.language)} ${objective.unit || ''}`
        : 'N/A';

    const targetValueDisplay = hasQuantitativeValues && objective.targetValue != null
        ? `${objective.targetValue.toLocaleString(settings.language)} ${objective.unit || ''}`
        : 'N/A';

    // Last Updated Date logic
    const lastUpdated = objective.updatedAt
        ? formatDateByPreference(objective.updatedAt, settings.dateFormat, settings.language)
        : 'N/A';
    
    // --- Manejadores de Eventos ---

    // Navega a la página de detalles (acción principal de la tarjeta)
    const handleViewDetails = () => navigate(`/objectives/${objective.id}`);

    // Edita el objetivo
    const handleEdit = (e) => {
        e.stopPropagation(); // Evita que se active el click de la tarjeta
        navigate(`/objectives/edit/${objective.id}`);
    };
    
    // Archiva el objetivo
    const handleArchive = async (e) => {
        e.stopPropagation(); // Evita que el clic se propague
        if (window.confirm(t('confirmationDialog.archiveObjective', { name: objective.name }))) {
            try {
                await api.updateObjective(objective.id, { status: 'ARCHIVED' });
                toast.success(t('toast.objectiveArchiveSuccess'));
                // Notifica al componente padre para que refresque la lista
                if (onObjectiveArchived) {
                    onObjectiveArchived();
                }
            } catch (error) {
                toast.error(error.message || t('toast.objectiveArchiveError'));
            }
        }
    };

    return (
        <article className={styles.objetivoCard} onClick={handleViewDetails} role="link" tabIndex="0" aria-label={`Ver detalles de ${objective.name}`}>
            <div className={styles.cardContent}>
                <header className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{objective.name}</h3>
                    <div className={styles.categoryBadge}>
                        {getCategoryIcon(objective.category)}
                        <span>{t(`categories.${objective.category.toLowerCase()}`, objective.category)}</span>
                    </div>
                </header>

                {objective.description && <p className={styles.cardDescription}>{objective.description}</p>}
                
                {hasQuantitativeValues && ( // Only show progress bar for quantifiable objectives
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span>{t('common.progress')}</span>
                            <span>{progressPercentage}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={`${styles.progressFill} ${
                                progressPercentage < 33 ? styles.progressFillLow :
                                progressPercentage < 66 ? styles.progressFillMedium :
                                styles.progressFillHigh
                            }`} style={{ width: `${progressPercentage}%` }} />
                        </div>
                        <div className={styles.progressValues}>
                            <div className={styles.progressValueBox}>
                                <div className={styles.progressValueLabel}>{t('objectiveCard.current')}</div>
                                <div className={styles.progressValueNumber}>{currentValueDisplay}</div>
                            </div>
                            <div className={styles.progressValueBox}>
                                <div className={styles.progressValueLabel}>{t('objectiveCard.target')}</div>
                                <div className={styles.progressValueNumber}>{targetValueDisplay}</div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className={styles.progressDate}>
                    <FaCalendarAlt className={styles.dataIcon} />
                    <span className={styles.dataLabel}>{t('common.updatedLabel')}</span>
                    <span className={styles.dataValue}>{lastUpdated}</span>
                </div>

                <div className={`${styles.cardStatus} ${styles[statusClassName]}`}>
                    {translatedStatus}
                </div>
            </div>

            <footer className={styles.cardFooter}>
                <div className={styles.cardActions}>
                    <Button className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`} variant="outline" size="small" onClick={handleEdit} leftIcon={<FaEdit />}>{t('common.edit')}</Button>
                    {objective.status !== 'ARCHIVED' && (
                        <Button className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`} variant="outline" size="small" onClick={handleArchive} leftIcon={<FaArchive />}>{t('common.archive')}</Button>
                    )}
                    <Button className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall} ${styles.buttonArchive}`} variant="outline" size="small" onClick={handleViewDetails} leftIcon={<FaEye />}>{t('common.details')}</Button>
                </div>
            </footer>
        </article>
    );
}

export default ObjetivoCard;