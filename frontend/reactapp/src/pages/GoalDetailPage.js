import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './GoalDetailPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GoalProgressChart from '../components/charts/GoalProgressChart';
import DistributionBarChart from '../components/charts/DistributionBarChart';
import Button from '../components/ui/Button';
import { differenceInDays, parseISO, format, isValid, isPast, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { FaCalendarAlt, FaFlagCheckered, FaExclamationTriangle, FaEdit, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';
import { IoBarChartSharp } from 'react-icons/io5';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import { useTranslation } from 'react-i18next';

const categoryNameToKeyMap = {
    'Finanzas': 'categories.finance',
    'Salud': 'categories.health',
    'Desarrollo personal': 'categories.personalDevelopment',
    'Relaciones': 'categories.relationships',
    'Carrera profesional': 'categories.career',
    'Otros': 'categories.other'
};

function GoalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all_time');

    const dateFnsLocales = { es: es, en: enUS };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;

    const calculateProgress = useMemo(() => {
        if (!goalData) return 0;
        const initialValue = parseFloat(goalData.valor_inicial_numerico);
        const targetValue = parseFloat(goalData.valor_cuantitativo);
        const isLowerBetter = goalData.es_menor_mejor;
        let currentValue = parseFloat(goalData.valor_actual);
        if (isNaN(currentValue)) currentValue = initialValue;
        if (isNaN(initialValue) || isNaN(targetValue) || isNaN(currentValue)) return 0;

        if (targetValue === initialValue) {
            return (isLowerBetter ? currentValue <= targetValue : currentValue >= targetValue) ? 100 : 0;
        }
        let progress = 0;
        if (isLowerBetter) {
            if (initialValue <= targetValue) return (currentValue <= targetValue) ? 100 : 0;
            const totalRange = initialValue - targetValue;
            progress = ((initialValue - currentValue) / totalRange) * 100;
        } else {
            if (initialValue >= targetValue) return (currentValue >= targetValue) ? 100 : 0;
            const totalRange = targetValue - initialValue;
            progress = ((currentValue - initialValue) / totalRange) * 100;
        }
        return Math.max(0, Math.min(100, progress));
    }, [goalData]);

    const derivedGoalData = useMemo(() => {
        const defaults = {
            daysRemaining: t('common.notAvailable'),
            dailyAverageNeeded: t('common.notAvailable'),
            statusTrend: {
                text: t('goalDetail.trends.notApplicable'),
                isPositive: true
            },
            isPastDue: false
        };

        if (!goalData) return defaults;

        const startDate = goalData.fecha_inicio && isValid(parseISO(goalData.fecha_inicio)) ? parseISO(goalData.fecha_inicio) : null;
        const endDate = goalData.fecha_fin && isValid(parseISO(goalData.fecha_fin)) ? parseISO(goalData.fecha_fin) : null;
        const today = new Date();
        const isPastDueCalc = !!endDate && isPast(endDate) && goalData.estado !== 'Completado' && calculateProgress < 100;

        if (endDate) {
            if (isPastDueCalc) {
                defaults.daysRemaining = t('goalDetail.overdue');
            } else if (goalData.estado === 'Completado' || calculateProgress >= 100) {
                defaults.daysRemaining = t('common.completed');
            } else if (!isPast(endDate)) {
                defaults.daysRemaining = differenceInDays(endDate, today);
            }
        }

        const initialValue = Number(goalData.valor_inicial_numerico);
        const targetValue = Number(goalData.valor_cuantitativo);
        const currentValue = Number(goalData.valor_actual ?? initialValue);
        const isQuantitative = !isNaN(initialValue) && !isNaN(targetValue);

        if (isQuantitative && startDate && endDate) {
            const totalDurationDays = differenceInDays(endDate, startDate) + 1;
            if (totalDurationDays > 0) {
                const requiredTotalChange = Math.abs(targetValue - initialValue);
                const requiredDailyChange = requiredTotalChange / totalDurationDays;
                defaults.dailyAverageNeeded = `${requiredDailyChange.toFixed(1)} ${goalData.unidad_medida || ''}${t('common.perDay')}`;

                const daysElapsed = isPast(startDate) ? differenceInDays(today, startDate) + 1 : 0;
                if (daysElapsed > 0 && !isPastDueCalc && calculateProgress < 100) {
                    const expectedProgressDelta = requiredDailyChange * daysElapsed;
                    const currentProgressDelta = Math.abs(currentValue - initialValue);

                    if (currentProgressDelta >= expectedProgressDelta) {
                        defaults.statusTrend = { text: t('goalDetail.trends.onTrack'), isPositive: true };
                    } else {
                        defaults.statusTrend = { text: t('goalDetail.trends.behind'), isPositive: false };
                    }
                } else if (calculateProgress >= 100) {
                    defaults.statusTrend = { text: t('goalDetail.trends.completed'), isPositive: true };
                } else if (isPastDueCalc) {
                    defaults.statusTrend = { text: t('goalDetail.trends.finishedUnmet'), isPositive: false };
                }
            }
        }

        return { ...defaults, isPastDue: isPastDueCalc };
    }, [goalData, calculateProgress, t]);

    const { daysRemaining, dailyAverageNeeded, statusTrend, isPastDue } = derivedGoalData;

    const isQuantitativeGoal = useMemo(() => (goalData?.valor_cuantitativo != null && !isNaN(Number(goalData.valor_cuantitativo))), [goalData]);

    const handleDeleteGoal = async () => {
        if (window.confirm(t('confirmationDialog.deleteObjective'))) {
            try {
                setLoading(true);
                await apiService.deleteObjective(id);
                toast.success(t('toast.objectiveDeleteSuccess'));
                navigate('/mis-objetivos');
            } catch (err) {
                toast.error(t('toast.objectiveDeleteError', { error: err.response?.data?.message || err.message }));
            } finally { setLoading(false); }
        }
    };

    const fetchGoalDetails = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await apiService.getObjectiveById(id);
            setGoalData(data);
        } catch (err) {
            setError(t('errors.objectiveLoadError'));
            toast.error(t('toast.objectiveLoadDetailsError'));
        } finally { setLoading(false); }
    }, [id, t]);

    useEffect(() => { if (id) fetchGoalDetails(); }, [id, fetchGoalDetails]);

    const timeframes = useMemo(() => [
        { value: '7_days', key: 'goalDetail.timeframes.7days' },
        { value: '30_days', key: 'goalDetail.timeframes.30days' },
        { value: '90_days', key: 'goalDetail.timeframes.90days' },
        { value: '1_year', key: 'goalDetail.timeframes.1year' },
        { value: 'all_time', key: 'goalDetail.timeframes.allTime' },
    ], []);

    const filteredProgressHistory = useMemo(() => {
        if (!goalData?.historial_progreso) return [];
        if (timeframe === 'all_time') return goalData.historial_progreso;

        const today = new Date();
        let startDateFilter;
        switch (timeframe) {
            case '7_days': startDateFilter = subDays(today, 6); break;
            case '30_days': startDateFilter = subDays(today, 29); break;
            case '90_days': startDateFilter = subDays(today, 89); break;
            case '1_year': startDateFilter = subDays(today, 364); break;
            default: return goalData.historial_progreso;
        }

        return goalData.historial_progreso.filter(entry =>
            isValid(parseISO(entry.date)) && parseISO(entry.date) >= startDateFilter
        );
    }, [goalData, timeframe]);

    if (loading) return <div className={styles.pageContainer}><LoadingSpinner size='large' text={t('loaders.loadingDetails')} /></div>;
    if (error) return <div className={`${styles.pageContainer} ${styles.errorContainer}`}><p>{error}</p><Button onClick={() => navigate('/')}>{t('common.backToDashboard')}</Button></div>;
    if (!goalData) return <div className={styles.pageContainer}><p>{t('errors.objectiveNotFound')}</p><Button onClick={() => navigate('/mis-objetivos')}>{t('common.backToMyObjectives')}</Button></div>;

    const finalProgressPercentage = goalData.estado === 'Completado' ? 100 : calculateProgress;
    const categoryKey = categoryNameToKeyMap[goalData.tipo_objetivo] || 'categories.other';

    return (
        <div className={styles.pageContainer}>
            <div className={styles.displayModeContent}>
                <div className={styles.header}>
                    <div className={styles.goalTitleContainer}>
                        <h1 className={styles.goalName}>{goalData.nombre}</h1>
                        {goalData.tipo_objetivo && <span className={styles.categoryTag}>{t(categoryKey, goalData.tipo_objetivo)}</span>}
                        <p className={styles.goalDescriptionText}>{goalData.descripcion || t('common.noDescription')}</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button onClick={() => navigate(`/objectives/edit/${id}`)} disabled={loading} className={styles.editButton}><FaEdit /> {t('goalDetail.buttons.edit')}</Button>
                        <Button onClick={() => navigate(`/objectives/${id}/update-progress`)} disabled={loading || !isQuantitativeGoal}><FaPlusCircle /> {t('goalDetail.buttons.updateProgress')}</Button>
                        <Button onClick={handleDeleteGoal} disabled={loading} variant="destructive"><FaTrashAlt /> {t('goalDetail.buttons.delete')}</Button>
                    </div>
                </div>

                {isPastDue && <div className={styles.overdueMessage}><FaExclamationTriangle className={styles.overdueIcon} /><p>{t('goalDetail.overdueMessage.line1')}</p><p>{t('goalDetail.overdueMessage.line2', { count: Math.abs(differenceInDays(parseISO(goalData.fecha_fin), new Date())) })}</p></div>}

                <div className={styles.topCardsGrid}>
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progress')}</h2>
                        {isQuantitativeGoal ? (
                            <>
                                <div className={styles.progressChartWrapper}><GoalProgressChart progressPercentage={finalProgressPercentage} /></div>
                                <div className={styles.progressValues}>
                                    <div className={styles.progressValueItem}>
                                        <span className={styles.valueLabel}>{t('goalDetail.dataLabels.current')}</span>
                                        <span className={styles.valueNumber}>{Number(goalData.valor_actual ?? goalData.valor_inicial_numerico ?? 0).toFixed(1)} {goalData.unidad_medida || ''}</span>
                                    </div>
                                    <div className={styles.progressValueItem}>
                                        <span className={styles.valueLabel}>{t('goalDetail.dataLabels.target')}</span>
                                        <span className={styles.valueNumber}>{Number(goalData.valor_cuantitativo || 0).toFixed(0)} {goalData.unidad_medida || ''}</span>
                                    </div>
                                </div>
                            </>
                        ) : (<p className={styles.noDataMessage}>{t('goalDetail.noData.notQuantitative')}</p>)}
                    </div>
                    <div className={`${styles.card} ${styles.dataCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.keyData')}</h2>
                        <div className={styles.dataList}>
                            <div className={styles.dataListItem}><FaCalendarAlt className={styles.icon} /><span className={styles.dataLabel}>{t('goalDetail.dataLabels.startDate')}</span><span className={styles.dataValue}>{goalData.fecha_inicio ? format(parseISO(goalData.fecha_inicio), 'd MMM yy', { locale: currentLocale }) : t('common.notAvailable')}</span></div>
                            <div className={styles.dataListItem}><FaFlagCheckered className={styles.icon} /><span className={styles.dataLabel}>{t('goalDetail.dataLabels.deadline')}</span><span className={styles.dataValue}>{goalData.fecha_fin ? format(parseISO(goalData.fecha_fin), 'd MMM yy', { locale: currentLocale }) : t('common.notAvailable')}</span></div>
                            <div className={styles.dataListItem}><FiClock className={styles.icon} /><span className={styles.dataLabel}>{t('goalDetail.dataLabels.daysRemaining')}</span><span className={`${styles.dataValue} ${daysRemaining === t('goalDetail.overdue') ? styles.overdue : ''}`}>{daysRemaining}</span></div>
                            {isQuantitativeGoal && (
                                <>
                                    <div className={styles.dataListItem}><IoBarChartSharp className={styles.icon} /><span className={styles.dataLabel}>{t('goalDetail.dataLabels.averageRate')}</span><span className={styles.dataValue}>{dailyAverageNeeded}</span></div>
                                    <div className={styles.dataListItem}>
                                        {statusTrend.isPositive ? <FiTrendingUp className={`${styles.icon} ${styles.trendUp}`} /> : <FiTrendingDown className={`${styles.icon} ${styles.trendDown}`} />}
                                        <span className={styles.dataLabel}>{t('goalDetail.dataLabels.trend')}</span>
                                        <span className={styles.dataValue}>{statusTrend.text}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`${styles.card} ${styles.distributionCard}`}>
                        <h2 className={styles.cardTitle}>{t('goalDetail.cards.progressDistribution')}</h2>
                        {isQuantitativeGoal ? (<div className={styles.chartContainer} style={{ height: '150px' }}><DistributionBarChart completedPercentage={finalProgressPercentage} remainingPercentage={100 - finalProgressPercentage} /></div>) : (<p className={styles.noDataMessage}>{t('goalDetail.noData.noDistributionData')}</p>)}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.progressHistoryCard}`}>
                    <h2 className={styles.cardTitle}>{t('goalDetail.cards.progressEvolution')}</h2>
                    <div className={styles.progressHistoryHeader}><select className={styles.timeframeSelect} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>{timeframes.map(tf => <option key={tf.value} value={tf.value}>{t(tf.key)}</option>)}</select></div>
                    <div className={styles.chartArea}>
                        {isQuantitativeGoal && filteredProgressHistory.length >= 2 ? (<ProgressLineChart progressHistory={filteredProgressHistory} unitMeasure={goalData.unidad_medida} targetValue={parseFloat(goalData.valor_cuantitativo)} isLowerBetter={goalData.es_menor_mejor} />) : (<p className={styles.noDataMessage}>{isQuantitativeGoal ? t('goalDetail.noData.notEnoughEvolutionData', { count: filteredProgressHistory.length }) : t('goalDetail.noData.evolutionOnlyQuantitative')}</p>)}
                    </div>
                </div>
                <Button onClick={() => navigate('/mis-objetivos')} className={styles.backButton}>{t('common.backToMyObjectives')}</Button>
            </div>
        </div>
    );
}

export default GoalDetailPage;