import React from 'react';
import styles from './ObjetivoCard.module.css';
import { useNavigate } from 'react-router-dom';
import {
    FaChartLine, FaArrowRight, FaRegDotCircle, FaHeartbeat, FaPiggyBank,
    FaUserGraduate, FaUsers, FaBriefcase, FaStar, FaEdit, FaEye, FaCalendarAlt
} from 'react-icons/fa';
import { formatDateByPreference } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';
import { useTranslation } from 'react-i18next';

// El mapeo de categorías a claves de traducción
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

function ObjetivoCard({ objective, isListItemStyle = false, onObjectiveDeleted }) {
    const { settings } = useSettings();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Traducir categoría y estado
    const translatedCategory = categoryKeyMap[objective.tipo_objetivo] 
        ? t(categoryKeyMap[objective.tipo_objetivo]) 
        : (objective.tipo_objetivo || t('categories.other'));

    const statusKey = objective.estado?.toLowerCase().replace(/\s/g, '') || 'pending';
    const translatedStatus = t(`status.${statusKey}`, objective.estado);


    // Usar el progreso calculado que viene del objetivo, asumiendo que es la fuente autorizada.
    const progressPercentage = objective.progreso_calculado !== undefined && objective.progreso_calculado !== null
        ? Math.round(objective.progreso_calculado)
        : 0;

    const lastUpdated = objective.updatedAt
        ? formatDateByPreference(objective.updatedAt, settings.dateFormat, settings.language)
        : 'N/A';

    const handleCardClick = () => {
        navigate(`/objectives/${objective.id_objetivo}`);
    };

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

    // Renderizado de la tarjeta detallada
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
            : initialValue; // Si valor_actual no es numérico, usar initial.
        if (!isNaN(initialValue) && !isNaN(targetValue) && !isNaN(currentValue)) {
            hasQuantitativeValues = true;
        }
    }
    
    // Determinar si se muestra la barra de progreso basado en el estado o si es cuantitativo
    if (objective.estado === 'Completado') {
        showProgressBar = true; 
        // progressPercentage ya es 100 si el estado es Completado y viene así del backend,
        // o se puede forzar aquí si es necesario: progressPercentage = 100;
    } else if (hasQuantitativeValues) {
        showProgressBar = true;
    } else if (objective.tipo_objetivo_secundario === 'Cualitativo' && objective.estado === 'En progreso') {
        // Para objetivos cualitativos "En progreso" podrías querer mostrar una barra genérica o nada.
        // Si se asume que progreso_calculado ya maneja esto (ej. 50% para En Progreso cualitativo), no se necesita lógica extra.
        showProgressBar = true; // O basado en si progreso_calculado > 0
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
                                style={{ width: `${progressPercentage}%` }} // Usar progressPercentage consistentemente
                            ></div>
                        </div>
                    </div>
                )}

                {showProgressBar && hasQuantitativeValues && ( // Solo mostrar valores si es cuantitativo
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
                    <span className={styles.dataValue}>{lastUpdated}</span> {/* Usar lastUpdated consistentemente */}
                </div>
                <div className={`${styles.cardStatus} ${styles[statusClassName]}`}>
                    {translatedStatus}
                </div>
            </div>
            <div className={styles.cardFooter}>
                <div className={styles.cardActions}>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={() => navigate(`/objectives/edit/${objective.id_objetivo}`)}
                        aria-label={t('objectiveCard.viewDetailsAria', { name: objective.nombre })}
                    >
                        <FaEdit className={styles.buttonIcon} />
                        {t('common.edit')}
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonOutline} ${styles.buttonSmall}`}
                        onClick={handleCardClick}
                        aria-label={t('objectiveCard.viewDetailsAria', { name: objective.nombre })}
                    >
                        <FaEye className={styles.buttonIcon} />
                        {t('common.details')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ObjetivoCard;