import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import api from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FaCircle } from 'react-icons/fa';

// Componentes Hijos
import StatsCard from '../components/objetivos/StatsCard';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import RecentObjectivesList from '../components/objetivos/RecentObjectivesList';
import RecentActivityFeed from '../components/objetivos/RecentActivityFeed';
import ProgressBar from '../components/ui/ProgressBar';

const categoryNameToKeyMap = {
    'Finanzas': 'categories.finance',
    'Salud': 'categories.health',
    'Desarrollo personal': 'categories.personalDevelopment',
    'Relaciones': 'categories.relationships',
    'Carrera profesional': 'categories.career',
    'Otros': 'categories.other'
};

function DashboardPage() {
    const { t } = useTranslation();
    const [summaryData, setSummaryData] = useState({
        totalObjectives: 0,
        statusCounts: {},
        averageProgress: 0,
        dueSoonCount: 0,
        categoryDistribution: [],
    });
    const [recentObjectives, setRecentObjectives] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const processedNoObjectivesRef = useRef(false);

    const translatedCategoryData = useMemo(() => {
        if (!summaryData.categoryDistribution) return [];
        return summaryData.categoryDistribution.map(item => ({
            ...item,
            name: t(categoryNameToKeyMap[item.name] || item.name)
        }));
    }, [summaryData.categoryDistribution, t]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        let localRedirected = false;

        try {
            const results = await Promise.allSettled([
                api.getDashboardSummaryStats(),
                api.getDashboardRecentObjectives(4),
                api.getDashboardRecentActivities(5)
            ]);

            const [summaryResult, objectivesResult, activityResult] = results;

            if (summaryResult.status === 'fulfilled' && summaryResult.value) {
                const summaryValue = summaryResult.value;
                if ((summaryValue.totalObjectives || 0) === 0 && !processedNoObjectivesRef.current) {
                    processedNoObjectivesRef.current = true;
                    toast.info(t('toast.welcomeCreateFirst'), { autoClose: 4000 });
                    navigate('/objectives', { replace: true});
                    localRedirected = true;
                    return;
                }
                setSummaryData(summaryValue);
            } else if (summaryResult.status === 'rejected') {
                throw summaryResult.reason;
            }

            if (!localRedirected) {
                if (objectivesResult.status === 'fulfilled') setRecentObjectives(objectivesResult.value || []);
                else toast.warn(t('toast.recentObjectivesLoadError'));
                if (activityResult.status === 'fulfilled') setRecentActivities(activityResult.value || []);
                else toast.warn(t('toast.recentActivityLoadError'));
            }

        } catch (err) {
            setError(err.data?.message || err.message || t('toast.dashboardLoadError'));
        } finally {
            if (!localRedirected) setLoading(false);
        }
    }, [navigate, t]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const renderStatusList = () => {
        const statusKeyMap = {
            'En progreso': 'inProgress', 'Pendiente': 'pending', 'Completado': 'completed',
            'Fallido': 'failed', 'Archivado': 'archived', 'No Iniciados': 'notStarted' // Asumiendo 'notStarted' como clave
        };
        const statusOrder = Object.keys(statusKeyMap);
        const statusColors = {
            'inProgress': 'var(--info-color, #6f42c1)',
            'pending': 'var(--warning-color, #ffc107)',
            'completed': 'var(--success-color, #28a745)',
            'failed': 'var(--destructive-color, #dc3545)',
            'archived': 'var(--secondary-color, #6c757d)',
            'notStarted': 'var(--muted-color, #adb5bd)',
        };

        const statusesToDisplay = statusOrder.filter(statusName => summaryData.statusCounts?.[statusName] > 0);

        if (summaryData.totalObjectives > 0 && statusesToDisplay.length === 0) {
            return (
                <ul className={styles.statusList}>
                    <li className={styles.statusItem}><span className={styles.statusName}>{t('dashboard.noStatusBreakdown')}</span></li>
                </ul>
            );
        }

        return (
            <ul className={styles.statusList}>
                {statusesToDisplay.map(statusName => {
                    const statusKey = statusKeyMap[statusName] || statusName.toLowerCase().replace(/\s/g, '');
                    return (
                        <li key={statusName} className={styles.statusItem}>
                            <FaCircle style={{ color: statusColors[statusKey], marginRight: '8px', fontSize: '0.7em', verticalAlign: 'middle' }}/>
                            <span className={styles.statusName}>{t(`status.${statusKey}`, statusName)}</span>
                            <span className={styles.statusCount}>{summaryData.statusCounts[statusName]}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    if (loading) {
        return <div className={styles.dashboardLoadingState}><LoadingSpinner size="large" text={t('loaders.loadingDashboard')} /></div>;
    }

    if (error && !summaryData.totalObjectives) {
        return (
            <div className={styles.dashboardErrorState}>
                <p className={styles.errorMessageText}>{t('common.errorPrefix', { error: error })}</p>
                <Button onClick={fetchDashboardData} variant="secondary">{t('common.retry')}</Button>
            </div>
        );
    }

    return (
        <div className={styles.dashboardPageLayout}>
            <section className={styles.statsRowContainer}>
                <StatsCard title={t('dashboard.stats.totalObjectives')} value={summaryData.totalObjectives.toString()} linkTo="/mis-objetivos" linkText={t('dashboard.stats.viewAllObjectives')}>
                    {summaryData.totalObjectives > 0 ? renderStatusList() : <p className={styles.noStatusData}>{t('dashboard.stats.noObjectives')}</p>}
                </StatsCard>

                <StatsCard title={t('dashboard.stats.averageProgress')} value={summaryData.averageProgress || 0} decimalPlacesToShow={1} valueDescription="%">
                    <ProgressBar percentage={summaryData.averageProgress || 0} />
                </StatsCard>

                <StatsCard title={t('dashboard.stats.dueSoon')} value={summaryData.dueSoonCount.toString()} valueDescription={t('dashboard.stats.objectives')} details={t('dashboard.stats.dueSoonDetails')} linkTo="/mis-objetivos?filter=dueSoon" linkText={t('dashboard.stats.viewCalendar')} />

                <StatsCard title={t('dashboard.stats.categories')} details={summaryData.categoryDistribution?.length ? t('dashboard.stats.mainCategory', { name: summaryData.categoryDistribution[0]?.name || t('common.notAvailable') }) : t('dashboard.stats.viewCategoryDetails')} linkTo="/analisis" linkText={t('dashboard.stats.viewAnalysis')}>
                    <CategoryDonutChart data={translatedCategoryData} simpleMode={true} />
                </StatsCard>
            </section>

            <section className={styles.bottomSectionsGrid}>
                <div className={styles.objectivesSectionWrapper}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.sections.keyObjectives')}</h3>
                    <div className={styles.objectivesPreviewWrapper}><RecentObjectivesList objectives={recentObjectives} /></div>
                </div>
                <div className={styles.activitySectionWrapper}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.sections.recentActivity')}</h3>
                    <div className={styles.activityFeedWrapper}><RecentActivityFeed activities={recentActivities} /></div>
                </div>
            </section>

            {error && (summaryData.totalObjectives > 0) && (
                <p className={styles.partialErrorText}>
                    {t('dashboard.partialError')}
                    <Button onClick={fetchDashboardData} variant="link" size="small">{t('common.retry')}</Button>
                </p>
            )}
        </div>
    );
}

export default DashboardPage;