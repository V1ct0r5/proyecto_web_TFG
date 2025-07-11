// frontend/reactapp/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import api from '../services/apiService';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import StatsCard from '../components/objetivos/StatsCard';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import RecentObjectivesList from '../components/objetivos/RecentObjectivesList';
import RecentActivityFeed from '../components/objetivos/RecentActivityFeed';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const CATEGORY_MAP = {
    'HEALTH': 'categories.health',
    'FINANCE': 'categories.finance',
    'PERSONAL_DEV': 'categories.personalDevelopment',
    'RELATIONSHIPS': 'categories.relationships',
    'CAREER': 'categories.career',
    'OTHER': 'categories.other'
};

const STATUS_MAP = {
    'IN_PROGRESS': { key: 'status.inProgress', color: 'var(--info)' },
    'PENDING': { key: 'status.pending', color: 'var(--warning)' },
    'COMPLETED': { key: 'status.completed', color: 'var(--success)' },
    'FAILED': { key: 'status.failed', color: 'var(--destructive)' },
    'ARCHIVED': { key: 'status.archived', color: 'var(--muted-foreground)' }
};

function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [summaryData, setSummaryData] = useState(null);
    const [recentObjectives, setRecentObjectives] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasBeenRedirectedRef = useRef(false);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, objectivesRes, activitiesRes] = await Promise.allSettled([
                api.getDashboardSummary(),
                api.getRecentObjectives(4),
                api.getRecentActivities(5)
            ]);

            if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
                const summary = summaryRes.value.data;
                setSummaryData(summary);
                if (summary.totalObjectives === 0 && !hasBeenRedirectedRef.current) {
                    hasBeenRedirectedRef.current = true;
                    toast.info(t('toast.welcomeCreateFirst'));
                    navigate('/objectives/new', { replace: true });
                    return;
                }
            } else { throw summaryRes.reason || new Error('No se pudo cargar el resumen'); }

            // Extraemos el array de la propiedad 'data' del objeto de respuesta.
            if (objectivesRes.status === 'fulfilled') setRecentObjectives(objectivesRes.value.data || []);
            if (activitiesRes.status === 'fulfilled') setRecentActivities(activitiesRes.value.data || []);

        } catch (err) {
            const errorMessage = err?.message || (typeof err === 'string' ? err : t('toast.dashboardLoadError'));
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [navigate, t]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const categoryChartData = useMemo(() => {
        if (!summaryData?.categories) return [];
        return summaryData.categories.map(item => ({
            name: t(CATEGORY_MAP[item.category] || item.category),
            value: item.count
        }));
    }, [summaryData, t]);

    const renderStatusList = () => (
        <ul className={styles.statusList}>
            {Object.entries(summaryData.statusCounts || {}).map(([status, count]) => {
                const statusInfo = STATUS_MAP[status];
                if (!statusInfo || count === 0) return null;
                return (
                    <li key={status} className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ backgroundColor: statusInfo.color }} />
                        <span className={styles.statusName}>{t(statusInfo.key, status)}</span>
                        <span className={styles.statusCount}>{count}</span>
                    </li>
                );
            })}
        </ul>
    );

    if (loading) {
        return <div className={styles.dashboardLoadingState}><LoadingSpinner size="large" text={t('loaders.loadingDashboard')} /></div>;
    }

    if (error) {
        return (
            <div className={styles.dashboardErrorState}>
                <p className={styles.errorMessageText}>{t('common.errorPrefix', { error })}</p>
                <Button onClick={fetchDashboardData} variant="secondary">{t('common.retry')}</Button>
            </div>
        );
    }

    if (!summaryData) return null;

    return (
        <div className={styles.dashboardPageLayout}>
            <section className={styles.statsRowContainer}>
                <StatsCard title={t('dashboard.stats.totalObjectives')} value={String(summaryData.totalObjectives)} linkTo="/my-objectives">
                    {summaryData.totalObjectives > 0 ? renderStatusList() : <p className={styles.noStatusData}>{t('dashboard.stats.noObjectives')}</p>}
                </StatsCard>
                <StatsCard title={t('dashboard.stats.averageProgress')} value={summaryData.averageProgress} valueDescription="%" decimalPlacesToShow={0}>
                    <ProgressBar percentage={summaryData.averageProgress} />
                </StatsCard>
                <StatsCard title={t('dashboard.stats.dueSoon')} value={String(summaryData.dueSoonCount)} valueDescription={t('dashboard.stats.objectives')} details={t('dashboard.stats.dueSoonDetails')} />
                <StatsCard title={t('dashboard.stats.categories')} linkTo="/analysis">
                    <CategoryDonutChart data={categoryChartData} />
                </StatsCard>
            </section>
            <section className={styles.bottomSectionsGrid}>
                <div className={styles.sectionCard}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.sections.keyObjectives')}</h3>
                    <RecentObjectivesList objectives={recentObjectives} />
                </div>
                <div className={styles.sectionCard}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.sections.recentActivity')}</h3>
                    <RecentActivityFeed activities={recentActivities} />
                </div>
            </section>
        </div>
    );
}

export default DashboardPage;