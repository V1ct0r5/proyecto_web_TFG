import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import api from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';

// Iconos
import { FaClock, FaChartPie, FaCircle } from 'react-icons/fa'; // FaChartBar eliminado

// Componentes Hijos
import StatsCard from '../components/objetivos/StatsCard';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import RecentObjectivesList from '../components/objetivos/RecentObjectivesList';
import RecentActivityFeed from '../components/objetivos/RecentActivityFeed';
import ProgressBar from '../components/ui/ProgressBar';

function DashboardPage() {
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

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        let localRedirected = false;

        try {
            const summaryPromise = api.getDashboardSummaryStats();
            const objectivesPreviewPromise = api.getDashboardRecentObjectives(4);
            const activityPromise = api.getDashboardRecentActivities(5);

            const results = await Promise.allSettled([
                summaryPromise, objectivesPreviewPromise, activityPromise
            ]);

            const [summaryResult, objectivesResult, activityResult] = results;

            if (summaryResult.status === 'fulfilled' && summaryResult.value) {
                const summaryValue = summaryResult.value;
                const currentTotalObjectives = summaryValue.totalObjectives || 0;

                if (currentTotalObjectives === 0) {
                    if (!processedNoObjectivesRef.current) {
                        processedNoObjectivesRef.current = true;
                        toast.info("¡Bienvenido! Parece que aún no tienes objetivos. Vamos a crear el primero.", { autoClose: 4000 });
                        navigate('/objectives', { replace: true, state: { message: "Crea tu primer objetivo para empezar." } });
                        setSummaryData({ totalObjectives: 0, statusCounts: {}, averageProgress: 0, dueSoonCount: 0, categoryDistribution: [] });
                        setRecentObjectives([]);
                        setRecentActivities([]);
                        localRedirected = true;
                        return;
                    } else if (window.location.pathname === '/dashboard') {
                        navigate('/objectives', { replace: true, state: { message: "Crea tu primer objetivo para empezar." } });
                        localRedirected = true;
                        return;
                    }
                } else {
                    processedNoObjectivesRef.current = false;
                }

                setSummaryData({
                    totalObjectives: summaryValue.totalObjectives || 0,
                    statusCounts: summaryValue.statusCounts || {},
                    averageProgress: summaryValue.averageProgress || 0,
                    dueSoonCount: summaryValue.dueSoonCount || 0,
                    categoryDistribution: Array.isArray(summaryValue.categoryDistribution) ? summaryValue.categoryDistribution : [],
                });

            } else if (summaryResult.status === 'rejected') {
                processedNoObjectivesRef.current = false;
                throw summaryResult.reason;
            }

            if (!localRedirected) {
                if (objectivesResult.status === 'fulfilled' && objectivesResult.value) {
                    setRecentObjectives(Array.isArray(objectivesResult.value) ? objectivesResult.value : []);
                } else if (objectivesResult.status === 'rejected') {
                    toast.warn("No se pudieron cargar los objetivos recientes.");
                }

                if (activityResult.status === 'fulfilled' && activityResult.value) {
                    setRecentActivities(Array.isArray(activityResult.value) ? activityResult.value : []);
                } else if (activityResult.status === 'rejected') {
                    toast.warn("No se pudo cargar la actividad reciente.");
                }
            }

        } catch (err) {
            const errorMessage = err.data?.message || err.message || "No se pudieron cargar los datos del panel de control.";
            setError(errorMessage);
            processedNoObjectivesRef.current = false;
            setSummaryData({ totalObjectives: 0, statusCounts: {}, averageProgress: 0, dueSoonCount: 0, categoryDistribution: [] });
            setRecentObjectives([]);
            setRecentActivities([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const renderStatusList = () => {
        const statusOrder = ['En progreso', 'Pendiente', 'Completado', 'Fallido', 'Archivado', 'No Iniciados'];
        const statusColors = {
            'En progreso': 'var(--info-color, #6f42c1)',
            'Pendiente': 'var(--warning-color, #ffc107)',
            'Completado': 'var(--success-color, #28a745)',
            'Fallido': 'var(--destructive-color, #dc3545)',
            'Archivado': 'var(--secondary-color, #6c757d)',
            'No Iniciados': 'var(--muted-color, #adb5bd)',
        };

        const statusesToDisplay = statusOrder.filter(statusName =>
            summaryData.statusCounts &&
            summaryData.statusCounts[statusName] !== undefined &&
            summaryData.statusCounts[statusName] > 0
        );

        if (summaryData.totalObjectives > 0 && statusesToDisplay.length === 0) {
            return (
                <ul className={styles.statusList}>
                    <li className={styles.statusItem}>
                        <span className={styles.statusName}>No hay desglose de estados disponible</span>
                    </li>
                </ul>
            );
        }

        return (
            <ul className={styles.statusList}>
                {statusesToDisplay.map(statusName => (
                    <li key={statusName} className={styles.statusItem}>
                        <FaCircle
                            style={{
                                color: statusColors[statusName] || '#cccccc',
                                marginRight: '8px',
                                fontSize: '0.7em',
                                verticalAlign: 'middle'
                            }}
                        />
                        <span className={styles.statusName}>{statusName}</span>
                        <span className={styles.statusCount}>{summaryData.statusCounts[statusName]}</span>
                    </li>
                ))}
            </ul>
        );
    };

    if (loading) {
        return <div className={styles.dashboardLoadingState}><LoadingSpinner size="large" text="Cargando tu Panel de Control..." /></div>;
    }

    if (error && !summaryData.totalObjectives && recentObjectives.length === 0 && recentActivities.length === 0) {
        return (
            <div className={styles.dashboardErrorState}>
                <p className={styles.errorMessageText}>Error: {error}</p>
                <Button onClick={fetchDashboardData} variant="secondary">Reintentar</Button>
            </div>
        );
    }

    return (
        <div className={styles.dashboardPageLayout}>
            <section className={styles.statsRowContainer}>
                <StatsCard
                    title="Total de Objetivos"
                    value={summaryData.totalObjectives.toString()}
                    linkTo="/mis-objetivos"
                    linkText="Ver todos los objetivos"
                >
                    {summaryData.totalObjectives > 0 ? renderStatusList() : <p className={styles.noStatusData}>Aún no tienes objetivos.</p>}
                </StatsCard>

                <StatsCard
                    title="Progreso Promedio"
                    value={summaryData.averageProgress || 0}
                    decimalPlacesToShow={1}
                    valueDescription="%"
                >
                    <ProgressBar
                        percentage={summaryData.averageProgress || 0}
                    />
                </StatsCard>

                <StatsCard
                    title="PRÓXIMOS A VENCER"
                    value={summaryData.dueSoonCount.toString()}
                    valueDescription="objetivos"
                    details="En los próximos 7 días"
                    linkTo="/mis-objetivos?filter=dueSoon"
                    linkText="Ver calendario"
                />

                <StatsCard
                    title="CATEGORÍAS"
                    details={
                        summaryData.categoryDistribution?.length
                            ? `Principal: ${summaryData.categoryDistribution[0]?.name || 'N/A'}`
                            : 'Ver detalle de categorías'
                    }
                    linkTo="/analisis"
                    linkText="Ver Análisis"
                >
                    <CategoryDonutChart
                        data={summaryData.categoryDistribution}
                        simpleMode={true}
                    />
                </StatsCard>
            </section>

            <section className={styles.bottomSectionsGrid}>
                <div className={styles.objectivesSectionWrapper}>
                    <h3 className={styles.sectionTitle}>Objetivos Clave / Recientes</h3>
                    <div className={styles.objectivesPreviewWrapper}>
                        <RecentObjectivesList objectives={recentObjectives} />
                    </div>
                </div>
                <div className={styles.activitySectionWrapper}>
                    <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
                    <div className={styles.activityFeedWrapper}>
                        <RecentActivityFeed activities={recentActivities} />
                    </div>
                </div>
            </section>

            {error && (summaryData.totalObjectives > 0 || recentObjectives.length > 0 || recentActivities.length > 0) && (
                <p className={styles.partialErrorText}>
                    Algunos datos del dashboard no pudieron cargarse. La información mostrada podría estar incompleta.
                    <Button onClick={fetchDashboardData} variant="link" size="small">Reintentar</Button>
                </p>
            )}
        </div>
    );
}

export default DashboardPage;