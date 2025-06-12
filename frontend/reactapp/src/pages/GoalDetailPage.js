// frontend/reactapp/src/pages/GoalDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { differenceInDays, parseISO, format, isValid, isPast, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

// Utilidades y Servicios
import api from '../services/apiService';
import { calculateProgressPercentage } from '../utils/progressUtils';

// Iconos
import { FaCalendarAlt, FaFlagCheckered, FaExclamationTriangle, FaEdit, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';

// Componentes
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import GoalProgressChart from '../components/charts/GoalProgressChart';
import DistributionBarChart from '../components/charts/DistributionBarChart';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import styles from './GoalDetailPage.module.css';

// Mapeo de categorías para traducción
const CATEGORY_I18N_KEYS = {
    HEALTH: 'categories.health',
    FINANCE: 'categories.finance',
    PERSONAL_DEV: 'categories.personalDevelopment',
    RELATIONSHIPS: 'categories.relationships',
    CAREER: 'categories.career',
    OTHER: 'categories.other'
};

function GoalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    const [objective, setObjective] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all_time');

    const dateLocale = i18n.language === 'es' ? es : enUS;

    useEffect(() => {
        api.getObjectiveById(id)
            .then(data => setObjective(data))
            .catch(err => {
                setError(err.message || t('errors.objectiveLoadError'));
                toast.error(err.message || t('errors.objectiveLoadError'));
            })
            .finally(() => setLoading(false));
    }, [id, t]);
    
    // --- Cálculos Derivados ---

    const isQuantitative = useMemo(() => (
        objective?.targetValue != null && !isNaN(Number(objective.targetValue))
    ), [objective]);

    const progressPercentage = useMemo(() => {
        if (!objective || !isQuantitative) return 0;
        return calculateProgressPercentage(objective);
    }, [objective, isQuantitative]);

    const derivedData = useMemo(() => {
        const defaults = { daysRemaining: 'N/A', isPastDue: false, trend: t('goalDetail.trends.notApplicable') };
        if (!objective || !objective.endDate) return defaults;
        
        const endDate = parseISO(objective.endDate);
        if (!isValid(endDate)) return defaults;

        const isPastDue = isPast(endDate) && progressPercentage < 100;
        defaults.isPastDue = isPastDue;
        defaults.daysRemaining = isPastDue ? t('goalDetail.overdue') : differenceInDays(endDate, new Date());
        
        // Lógica de tendencia
        if (isQuantitative && objective.startDate) {
            const startDate = parseISO(objective.startDate);
            const totalDuration = differenceInDays(endDate, startDate);
            const elapsedDuration = differenceInDays(new Date(), startDate);
            if (totalDuration > 0 && elapsedDuration > 0 && !isPastDue) {
                const expectedProgress = (elapsedDuration / totalDuration) * 100;
                if (progressPercentage >= expectedProgress) {
                    defaults.trend = t('goalDetail.trends.onTrack');
                } else {
                    defaults.trend = t('goalDetail.trends.behind');
                }
            }
        }
        return defaults;
    }, [objective, progressPercentage, isQuantitative, t]);

    const filteredProgressHistory = useMemo(() => {
        if (!objective?.progressEntries) return [];
        if (timeframe === 'all_time') return objective.progressEntries;

        const today = new Date();
        let startDateFilter;
        switch (timeframe) {
            case '7_days': startDateFilter = subDays(today, 6); break;
            case '30_days': startDateFilter = subDays(today, 29); break;
            default: return objective.progressEntries;
        }
        return objective.progressEntries.filter(entry => parseISO(entry.entryDate) >= startDateFilter);
    }, [objective, timeframe]);

    // --- Manejadores de Acciones ---

    const handleDelete = async () => {
        if (window.confirm(t('confirmationDialog.deleteObjective', { name: objective.name }))) {
            try {
                await api.deleteObjective(id);
                toast.success(t('toast.objectiveDeleteSuccess'));
                navigate('/mis-objetivos');
            } catch (err) {
                toast.error(err.message || t('toast.objectiveDeleteError'));
            }
        }
    };
    
    // --- Renderizado ---

    if (loading) return <div className={styles.pageContainer}><LoadingSpinner size='large' text={t('loaders.loadingDetails')} /></div>;
    if (error) return <div className={`${styles.pageContainer} ${styles.errorContainer}`}><p>{error}</p></div>;
    if (!objective) return <div className={styles.pageContainer}><p>{t('errors.objectiveNotFound')}</p></div>;

    const categoryKey = CATEGORY_I18N_KEYS[objective.category] || objective.category;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.goalTitleContainer}>
                    <h1 className={styles.goalName}>{objective.name}</h1>
                    <span className={styles.categoryTag}>{t(categoryKey)}</span>
                    <p className={styles.goalDescription}>{objective.description || t('common.noDescription')}</p>
                </div>
                <div className={styles.headerActions}>
                    <Button onClick={() => navigate(`/objectives/edit/${id}`)} leftIcon={<FaEdit />}>{t('common.edit')}</Button>
                    {isQuantitative && <Button onClick={() => navigate(`/objectives/${id}/update-progress`)} leftIcon={<FaPlusCircle />}>{t('goalDetail.buttons.updateProgress')}</Button>}
                    <Button onClick={handleDelete} variant="destructive" leftIcon={<FaTrashAlt />}>{t('goalDetail.buttons.delete')}</Button>
                </div>
            </header>

            {derivedData.isPastDue && <div className={styles.overdueMessage}><FaExclamationTriangle /> {t('goalDetail.overdue')}</div>}

            <div className={styles.topCardsGrid}>
                {isQuantitative && (
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progress')}</h2>
                        <div className={styles.progressChartWrapper}>
                            <GoalProgressChart progressPercentage={progressPercentage} />
                        </div>
                        <div className={styles.progressValues}>
                            <div className={styles.progressValueItem}>
                                <span className={styles.valueLabel}>{t('goalDetail.dataLabels.current')}</span>
                                <span className={styles.valueNumber}>{Number(objective.currentValue ?? objective.initialValue).toLocaleString()} {objective.unit}</span>
                            </div>
                            <div className={styles.progressValueItem}>
                                <span className={styles.valueLabel}>{t('goalDetail.dataLabels.target')}</span>
                                <span className={styles.valueNumber}>{Number(objective.targetValue).toLocaleString()} {objective.unit}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${styles.card} ${styles.dataCard}`}>
                    <h2 className={styles.cardTitle}>{t('goalDetail.cards.keyData')}</h2>
                    <div className={styles.dataList}>
                        <div className={styles.dataListItem}><FaCalendarAlt className={styles.icon} /><span>{t('goalDetail.dataLabels.startDate')}</span><span>{objective.startDate ? format(parseISO(objective.startDate), 'PPP', { locale: dateLocale }) : 'N/A'}</span></div>
                        <div className={styles.dataListItem}><FaFlagCheckered className={styles.icon} /><span>{t('goalDetail.dataLabels.deadline')}</span><span>{objective.endDate ? format(parseISO(objective.endDate), 'PPP', { locale: dateLocale }) : 'N/A'}</span></div>
                        <div className={styles.dataListItem}><FiClock className={styles.icon} /><span>{t('goalDetail.dataLabels.daysRemaining')}</span><span>{derivedData.daysRemaining}</span></div>
                        {isQuantitative && <div className={styles.dataListItem}><FiTrendingUp className={`${styles.icon} ${styles.trendUp}`} /><span>{t('goalDetail.dataLabels.trend')}</span><span>{derivedData.trend}</span></div>}
                    </div>
                </div>

                {isQuantitative && (
                    <div className={`${styles.card} ${styles.distributionCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progressDistribution')}</h2>
                        <div className={styles.chartContainer}>
                            <DistributionBarChart completedPercentage={progressPercentage} remainingPercentage={100 - progressPercentage} />
                        </div>
                    </div>
                )}
            </div>
            
            {isQuantitative && (
                <div className={`${styles.card} ${styles.historyCard}`}>
                    <div className={styles.progressHistoryHeader}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progressEvolution')}</h2>
                        <select className={styles.timeframeSelect} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                            <option value="7_days">{t('goalDetail.timeframes.7days')}</option>
                            <option value="30_days">{t('goalDetail.timeframes.30days')}</option>
                            <option value="all_time">{t('goalDetail.timeframes.allTime')}</option>
                        </select>
                    </div>
                    <div className={styles.chartArea}>
                        {filteredProgressHistory.length >= 2 ? (
                            <ProgressLineChart progressHistory={filteredProgressHistory} unitMeasure={objective.unit} targetValue={parseFloat(objective.targetValue)} isLowerBetter={objective.isLowerBetter} />
                        ) : (<p className={styles.noDataMessage}>{t('goalDetail.noData.notEnoughEvolutionData')}</p>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GoalDetailPage;  