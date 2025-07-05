import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { differenceInDays, parseISO, format, isValid, isPast, subDays, startOfDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

import api from '../services/apiService';
import { calculateProgressPercentage } from '../utils/progressUtils';

import { FaCalendarAlt, FaFlagCheckered, FaExclamationTriangle, FaEdit, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FiTrendingUp, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import GoalProgressChart from '../components/charts/GoalProgressChart';
import DistributionBarChart from '../components/charts/DistributionBarChart';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import styles from './GoalDetailPage.module.css';

const CATEGORY_I18N_KEYS = {
    HEALTH: 'categories.health', FINANCE: 'categories.finance', 
    PERSONAL_DEV: 'categories.personalDevelopment', RELATIONSHIPS: 'categories.relationships', 
    CAREER: 'categories.career', OTHER: 'categories.other'
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
            .then(response => {
                const objectiveData = response?.data?.objective;
                if (!objectiveData) {
                    throw new Error(t('errors.objectiveNotFound'));
                }
                setObjective(objectiveData);
            })
            .catch(err => {
                setError(err.message || t('errors.objectiveLoadError'));
                toast.error(err.message || t('errors.objectiveLoadError'));
            })
            .finally(() => setLoading(false));
    }, [id, t]);
    
    const isQuantitative = useMemo(() => (
        objective?.targetValue != null && !isNaN(Number(objective.targetValue))
    ), [objective]);

    const progressPercentage = useMemo(() => {
        if (!objective || !isQuantitative) return 0;
        return calculateProgressPercentage(objective);
    }, [objective, isQuantitative]);

    const chartValues = useMemo(() => {
        const defaults = { progressMade: 0, progressRemaining: 0, totalJourney: 0 };
        if (!isQuantitative || !objective) {
            return defaults;
        }

        const initial = parseFloat(objective.initialValue ?? 0);
        const current = parseFloat(objective.currentValue ?? initial);
        const target = parseFloat(objective.targetValue);

        if (isNaN(initial) || isNaN(current) || isNaN(target)) {
            return defaults;
        }

        const totalJourney = Math.abs(target - initial);
        const progressMade = Math.abs(current - initial);
        // Nos aseguramos de que el progreso restante nunca sea negativo
        const progressRemaining = Math.max(0, totalJourney - progressMade);

        return { progressMade, progressRemaining, totalJourney };
        
    }, [objective, isQuantitative]);

    const derivedData = useMemo(() => {
        const defaults = { daysRemaining: t('common.notAvailable'), isPastDue: false, trendText: t('goalDetail.trends.notApplicable') };
        if (!objective || !objective.endDate) return defaults;
        
        const endDate = parseISO(objective.endDate);
        if (!isValid(endDate)) return defaults;

        const today = new Date();
        const isCompleted = objective.status === 'COMPLETED';
        const isPastDueCalc = isPast(endDate) && !isCompleted;
        
        defaults.isPastDue = isPastDueCalc;

        if(isCompleted) {
            defaults.daysRemaining = t('common.completed');
        } else if (isPastDueCalc) {
            defaults.daysRemaining = t('goalDetail.overdue');
        } else {
            defaults.daysRemaining = differenceInDays(endDate, today);
        }
        
        if (isQuantitative && objective.startDate && !isCompleted) {
            const startDate = parseISO(objective.startDate);
            const totalDuration = differenceInDays(endDate, startDate);
            const elapsedDuration = differenceInDays(today, startDate);
            if (totalDuration > 0 && elapsedDuration > 0 && !isPastDueCalc) {
                const expectedProgress = (elapsedDuration / totalDuration) * 100;
                defaults.trendText = progressPercentage >= expectedProgress ? t('goalDetail.trends.onTrack') : t('goalDetail.trends.behind');
            }
        } else if (isCompleted) {
            defaults.trendText = t('goalDetail.trends.completed');
        }
        return defaults;
    }, [objective, progressPercentage, isQuantitative, t]);

    const filteredProgressHistory = useMemo(() => {
        if (!objective?.progressEntries) return [];
        if (timeframe === 'all_time') return objective.progressEntries;

        const today = startOfDay(new Date());
        let startDateFilter;
        switch (timeframe) {
            case '7_days': startDateFilter = subDays(today, 6); break;
            case '30_days': startDateFilter = subDays(today, 29); break;
            default: return objective.progressEntries;
        }
        return objective.progressEntries.filter(entry => isValid(parseISO(entry.entryDate)) && startOfDay(parseISO(entry.entryDate)) >= startDateFilter);
    }, [objective, timeframe]);

    const handleDelete = async () => {
        if (window.confirm(t('confirmationDialog.deleteObjective', { name: objective.name }))) {
            try {
                await api.deleteObjective(id);
                toast.success(t('toast.objectiveDeleteSuccess'));
                navigate('/my-objectives');
            } catch (err) {
                toast.error(err.message || t('toast.objectiveDeleteError'));
            }
        }
    };
    
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
                    <Button onClick={() => navigate(`/objectives/edit/${id}`)} leftIcon={<FaEdit />} disabled={objective.status === 'ARCHIVED'}>{t('common.edit')}</Button>
                    {isQuantitative && <Button onClick={() => navigate(`/objectives/${id}/update-progress`)} leftIcon={<FaPlusCircle />} disabled={objective.status === 'ARCHIVED'}>{t('goalDetail.buttons.updateProgress')}</Button>}
                    <Button data-cy="delete-objective-button" onClick={handleDelete} variant="destructive" leftIcon={<FaTrashAlt />}>{t('goalDetail.buttons.delete')}</Button>
                </div>
            </header>

            {derivedData.isPastDue && <div className={styles.overdueMessage}><FaExclamationTriangle /> {t('goalDetail.overdue')}</div>}

            <div className={styles.topCardsGrid}>
                {isQuantitative && (
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progress')}</h2>
                        <div className={styles.progressChartWrapper}><GoalProgressChart progressPercentage={progressPercentage} /></div>
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
                        {isQuantitative && <div className={styles.dataListItem}><FiTrendingUp className={`${styles.icon} ${styles.trendUp}`} /><span>{t('goalDetail.dataLabels.trend')}</span><span>{derivedData.trendText}</span></div>}
                    </div>
                </div>
                {isQuantitative && (
                    <div className={`${styles.card} ${styles.distributionCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progressDistribution')}</h2>
                        <div className={styles.chartContainer}>
                            <DistributionBarChart 
                                progressMade={chartValues.progressMade}
                                progressRemaining={chartValues.progressRemaining}
                                totalJourney={chartValues.totalJourney}
                                unit={objective.unit}
                            />
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
                            <ProgressLineChart
                                progressHistory={filteredProgressHistory}
                                unitMeasure={objective.unit}
                                targetValue={parseFloat(objective.targetValue)}
                                isLowerBetter={objective.isLowerBetter}
                            />
                        ) : (<p className={styles.noDataMessage}>{t('goalDetail.noData.notEnoughEvolutionData', { count: filteredProgressHistory.length })}</p>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GoalDetailPage;