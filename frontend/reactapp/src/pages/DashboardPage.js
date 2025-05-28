// frontend/reactapp/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import api from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';

// Iconos
import { FaClock, FaChartPie, FaChartBar, FaCircle } from 'react-icons/fa';

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
    const navigate = useNavigate(); // eslint-disable-line no-unused-vars

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const summaryPromise = api.getDashboardSummaryStats();
            const objectivesPreviewPromise = api.getDashboardRecentObjectives(4);
            const activityPromise = api.getDashboardRecentActivities(5);

            const results = await Promise.allSettled([
                summaryPromise, objectivesPreviewPromise, activityPromise
            ]);

            const [summaryResult, objectivesResult, activityResult] = results;

            if (summaryResult.status === 'fulfilled' && summaryResult.value) {
                setSummaryData({
                    totalObjectives: summaryResult.value.totalObjectives || 0,
                    statusCounts: summaryResult.value.statusCounts || {},
                    averageProgress: summaryResult.value.averageProgress || 0,
                    dueSoonCount: summaryResult.value.dueSoonCount || 0,
                    categoryDistribution: Array.isArray(summaryResult.value.categoryDistribution) ? summaryResult.value.categoryDistribution : [],
                });
            } else if (summaryResult.status === 'rejected') {
                console.error("Error fetching summary stats:", summaryResult.reason);
                // Considerar este error como crítico para el dashboard
                throw summaryResult.reason;
            }

            if (objectivesResult.status === 'fulfilled' && objectivesResult.value) {
                setRecentObjectives(Array.isArray(objectivesResult.value) ? objectivesResult.value : []);
            } else if (objectivesResult.status === 'rejected') {
                console.error("Error fetching recent objectives:", objectivesResult.reason);
                toast.warn("No se pudieron cargar los objetivos recientes.");
            }

            if (activityResult.status === 'fulfilled' && activityResult.value) {
                setRecentActivities(Array.isArray(activityResult.value) ? activityResult.value : []);
            } else if (activityResult.status === 'rejected') {
                console.error("Error fetching recent activities:", activityResult.reason);
                toast.warn("No se pudo cargar la actividad reciente.");
            }
        } catch (err) {
            console.error("DashboardPage: Error crítico al cargar datos del dashboard:", err);
            const errorMessage = err.data?.message || err.message || "No se pudieron cargar los datos del panel de control.";
            setError(errorMessage);
            // No mostrar toast aquí si ya se muestra un error general en la página
            // Resetear datos a un estado vacío o por defecto en caso de error crítico
            setSummaryData({ totalObjectives: 0, statusCounts: {}, averageProgress: 0, dueSoonCount: 0, categoryDistribution: [] });
            setRecentObjectives([]);
            setRecentActivities([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const renderStatusList = () => {
        const statusOrder = ['En progreso', 'Pendiente', 'Completado', 'Fallido', 'Archivado', 'No Iniciados'];
        const statusColors = {
            'En progreso': 'var(--info-color, #6f42c1)', // Morado/Púrpura para "En Progreso"
            'Pendiente': 'var(--warning-color, #ffc107)', // Amarillo/Naranja para "Pendiente"
            'Completado': 'var(--success-color, #28a745)', // Verde para "Completado"
            'Fallido': 'var(--destructive-color, #dc3545)', // Rojo para "Fallido"
            'Archivado': 'var(--secondary-color, #6c757d)', // Gris para "Archivado"
            'No Iniciados': 'var(--muted-color, #adb5bd)', // Gris más claro para "No Iniciados"
        };

        // Filtrar y ordenar los estados que tienen objetivos
        const statusesToDisplay = statusOrder.filter(statusName =>
            summaryData.statusCounts &&
            summaryData.statusCounts[statusName] !== undefined &&
            summaryData.statusCounts[statusName] > 0
        );

        // Si hay objetivos pero no hay desglose por estado (caso raro, pero posible)
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

    // Estado de carga principal para toda la página
    if (loading) {
        return <div className={styles.dashboardLoadingState}><LoadingSpinner size="large" text="Cargando tu Panel de Control..." /></div>;
    }

    // Estado de error crítico (si los datos principales como el sumario no se cargaron)
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
                    value={summaryData.totalObjectives.toString()} // StatsCard espera string o JSX para value
                    linkTo="/mis-objetivos"
                    linkText="Ver todos los objetivos"
                >
                    {summaryData.totalObjectives > 0 ? renderStatusList() : <p className={styles.noStatusData}>Aún no tienes objetivos.</p>}
                </StatsCard>

                <StatsCard
                    title="Progreso Promedio"
                    value={`${Math.round(summaryData.averageProgress || 0)}%`}
                >
                    <ProgressBar
                        percentage={summaryData.averageProgress || 0}
                    // El componente ProgressBar internamente define el texto basado en el porcentaje
                    />
                </StatsCard>

                <StatsCard
                    icon={<FaClock />}
                    title="PRÓXIMOS A VENCER"
                    value={summaryData.dueSoonCount.toString()}
                    valueDescription="objetivos" // Prop para describir la unidad del valor
                    details="En los próximos 7 días"
                    linkTo="/mis-objetivos?filter=dueSoon"
                    linkText="Ver calendario"
                />

                <StatsCard
                    icon={<FaChartPie />}
                    title="CATEGORÍAS"
                    // Muestra la categoría principal o un texto genérico si no hay distribución
                    details={
                        summaryData.categoryDistribution?.length
                            ? `Principal: ${summaryData.categoryDistribution[0]?.name || 'N/A'}`
                            : 'Ver detalle de categorías'
                    }
                    linkTo="/analisis" // Asumiendo que /analisis mostrará detalles de categorías
                    linkText="Ver Análisis"
                >
                    <CategoryDonutChart
                        data={summaryData.categoryDistribution}
                        simpleMode={true} // Modo simplificado para vista previa en dashboard
                    />
                </StatsCard>
            </section>

            <section className={styles.bottomSectionsGrid}>
                <div className={styles.objectivesPreviewWrapper}>
                    <RecentObjectivesList objectives={recentObjectives} />
                </div>
                <div className={styles.activityFeedWrapper}>
                    <RecentActivityFeed activities={recentActivities} />
                </div>
            </section>

            {/* Mensaje de error parcial si algunos datos fallaron pero otros se cargaron */}
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