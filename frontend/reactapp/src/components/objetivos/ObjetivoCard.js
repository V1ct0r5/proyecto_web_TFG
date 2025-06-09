// frontend/src/components/objetivos/ObjetivoCard.js
import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowRight, FaHeartbeat, FaPiggyBank,
    FaUserGraduate, FaUsers, FaBriefcase, FaStar, 
    FaEdit, FaEye, FaCalendarAlt, FaRegDotCircle, FaArchive
} from 'react-icons/fa';
import { formatDateByPreference } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/apiService';
import { toast } from 'react-toastify';

const categoryKeyMap = {
    'Salud': 'categories.health',
    'Finanzas': 'categories.finance',
    'Desarrollo personal': 'categories.personalDevelopment',
    'Relaciones': 'categories.relationships',
    'Carrera profesional': 'categories.career',
};

const getCategoryIcon = (category, isListItem = false) => {
    const iconProps = isListItem ? { className: styles.listItemTypeIcon } : {};
    switch (category) {
        case 'Salud': return <FaHeartbeat {...iconProps} />;
        case 'Finanzas': return <FaPiggyBank {...iconProps} />;
        case 'Desarrollo personal': return <FaUserGraduate {...iconProps} />;
        case 'Relaciones': return <FaUsers {...iconProps} />;
        case 'Carrera profesional': return <FaBriefcase {...iconProps} />;
        default: return isListItem ? <FaRegDotCircle {...iconProps} /> : <FaStar {...iconProps} />;
    }
};

// --- CORRECCIÓN: La firma del componente ahora acepta 'onObjectiveArchived' y 'onObjectiveDeleted'
function ObjetivoCard({ objective, isListItemStyle = false, onObjectiveArchived, onObjectiveDeleted }) {
    const { settings } = useSettings();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const translatedCategory = categoryKeyMap[objective.tipo_objetivo] 
        ? t(categoryKeyMap[objective.tipo_objetivo]) 
        : (objective.tipo_objetivo || t('categories.other'));

    const translatedStatus = t(objective.estadoKey || objective.estado);

    const progressPercentage = objective.progreso_calculado !== undefined && objective.progreso_calculado !== null
        ? Math.round(objective.progreso_calculado)
        : 0;

    const lastUpdated = objective.updatedAt
        ? formatDateByPreference(objective.updatedAt, settings.dateFormat, settings.language)
        : 'N/A';

    const handleCardClick = () => {
        navigate(`/objectives/${objective.id_objetivo}`);
    };

    // --- INICIO DE LA CORRECCIÓN: Lógica para archivar ---
    const handleArchive = async (e) => {
        e.stopPropagation(); // Evita que el clic se propague a la tarjeta y navegue
        if (window.confirm(t('confirmationDialog.archiveObjective', { name: objective.nombre }))) {
            try {
                await api.updateObjective(objective.id_objetivo, { estado: 'Archivado' });
                toast.success(t('toast.objectiveArchiveSuccess'));
                if (onObjectiveArchived) {
                    onObjectiveArchived(); // Llama a la función del padre para refrescar la lista
                }
            } catch (error) {
                toast.error(t('toast.objectiveArchiveError', { error: error.message }));
            }
        }
    };
    // --- FIN DE LA CORRECCIÓN ---

    if (isListItemStyle) {
        const objectiveTypeIcon = getCategoryIcon(objective.tipo_objetivo, true);
        return (
            <div
                className={styles.objetivoCardListItemStyle}
                onClick={handleCardClick}
                role="button"
                tabIndex="0"
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
                aria-label={t('objectiveCard.viewDetailsAria', { name: objective.nombre })}
            >
                <div className={styles.listItemIconContainer}>
                    {objectiveTypeIcon}
                </div>
                <div className={styles.listItemDetails}>
                    <h4 className={styles.listItemTitle}>{objective.nombre}</h4>
                    <p className={styles.listItemUpdateDate}>{t('objectiveCard.updated', { date: lastUpdated })}</p>
                </div>
                <div className={styles.listItemProgress}>
                    <span className={styles.listItemProgressText}>{t('common.progress')}</span>
                    <span className={styles.listItemProgressPercentage}>{progressPercentage}%</span>
                </div>
                <button
                    className={styles.listItemArrowButton}
                    onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                    aria-label={t('objectiveCard.viewDetailsAria', { name: objective.nombre })}
                >
                    <FaArrowRight />
                </button>
            </div>
        );
    }

    let showProgressBar = false;
    let initialValue = NaN, targetValue = NaN, currentValue = NaN;
    let hasQuantitativeValues = false;

    const isPotentiallyQuantitative =
        objective.valor_inicial_numerico !== null && typeof objective.valor_inicial_numerico !== 'undefined' &&
        objective.valor_cuantitativo !== null && typeof objective.valor_cuantitativo !== 'undefined';

    if (isPotentiallyQuantitative) {
        initialValue = parseFloat(objective.valor_inicial_numerico);
        targetValue = parseFloat(objective.valor_cuantitativo);
        currentValue = (objective.valor_actual !== null && typeof objective.valor_actual !== 'undefined' && !isNaN(parseFloat(objective.valor_actual)))
            ? parseFloat(objective.valor_actual)
            : initialValue;
        if (!isNaN(initialValue) && !isNaN(targetValue) && !isNaN(currentValue)) {
            hasQuantitativeValues = true;
        }
    }
    
    if (objective.estado === 'Completado' || hasQuantitativeValues) {
        showProgressBar = true;
    }

    const statusClassName = `status-${objective.estado?.toLowerCase().replace(/\s/g, '')}`;

    return (
        <div className={styles.objetivoCard}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeaderContent}>
                    <h3 className={styles.cardTitle}>{objective.nombre}</h3>
                    <div className={styles.categoryBadge}>
                        <span className={styles.categoryBadgeIcon}>{getCategoryIcon(objective.tipo_objetivo)}</span>
                        <span className={styles.categoryBadgeName}>{translatedCategory}</span>
                    </div>
                </div>
                {objective.descripcion && <p className={styles.cardDescription}>{objective.descripcion}</p>}
                
                {showProgressBar && (
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>{t('common.progress')}</span>
                            <span className={styles.progressPercentage}>{progressPercentage}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${
                                    progressPercentage < 33 ? styles.progressFillLow :
                                    progressPercentage < 66 ? styles.progressFillMedium :
                                    styles.progressFillHigh
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {showProgressBar && hasQuantitativeValues && (
                    <div className={styles.progressValues}>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>{t('objectiveCard.current')}</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(currentValue) ? (initialValue !== null && typeof initialValue !== 'undefined' && !isNaN(parseFloat(initialValue)) ? parseFloat(initialValue).toLocaleString(settings.language) : 'N/A') : currentValue.toLocaleString(settings.language)} {objective.unidad_medida || ''}
                            </div>
                        </div>
                        <div className={styles.progressValueBox}>
                            <div className={styles.progressValueLabel}>{t('objectiveCard.target')}</div>
                            <div className={styles.progressValueNumber}>
                                {isNaN(targetValue) ? 'N/A' : targetValue.toLocaleString(settings.language)} {objective.unidad_medida || ''}
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
            <div className={styles.cardFooter}>
                <div className={styles.cardActions}>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={(e) => {e.stopPropagation(); navigate(`/objectives/edit/${objective.id_objetivo}`)}}
                        aria-label={t('common.edit')}
                    >
                        <FaEdit className={styles.buttonIcon} />
                        {t('common.edit')}
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={(e) => {e.stopPropagation(); handleCardClick()}}
                        aria-label={t('common.details')}
                    >
                        <FaEye className={styles.buttonIcon} />
                        {t('common.details')}
                    </button>
                    {/* --- INICIO DE LA CORRECCIÓN: Botón de Archivar --- */}
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall} ${styles.buttonArchive}`}
                        onClick={handleArchive}
                        aria-label={t('common.archive')}
                    >
                        <FaArchive className={styles.buttonIcon} />
                        {t('common.archive')}
                    </button>
                    {/* --- FIN DE LA CORRECCIÓN --- */}
                </div>
            </div>
        </div>
    );
}

export default ObjetivoCard;