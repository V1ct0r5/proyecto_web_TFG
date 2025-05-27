// frontend/reactapp/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate para los links
import styles from './DashboardPage.module.css'; // Crearemos este archivo CSS Module
// Asumimos que tienes un apiService con los nuevos métodos (a crear)
// import api from '../services/apiService'; 
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button'; // Para "Ver todos"

// --- Importar futuros componentes del Dashboard ---
// import StatsCard from '../components/dashboard/StatsCard';
// import CategoryDonutChart from '../components/charts/CategoryDonutChart';
// import RecentObjectivesList from '../components/dashboard/RecentObjectivesList';
// import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';

// --- Iconos (ejemplos, necesitarás instalar react-icons o similar) ---
import { FaClipboardList, FaChartPie, FaClock, FaChartBar, FaArrowRight, FaListAlt, FaHistory } from 'react-icons/fa';

// --- Componentes Placeholder (mientras creamos los reales) ---
// Mueve estos a sus propios archivos en src/components/dashboard/ o src/components/charts/

const StatsCard = ({ title, value, details, linkTo, icon, linkText = "Ver detalles" }) => (
    <div className={styles.statsCardItem}>
        <div className={styles.statsIconWrapper}>{icon}</div>
        <div className={styles.statsContent}>
            <h3 className={styles.statsTitle}>{title}</h3>
            {value && <p className={styles.statsValue}>{value}</p>}
            {details && <p className={styles.statsDetails}>{details}</p>}
        </div>
        {linkTo && <Link to={linkTo} className={styles.statsLink}>{linkText} <FaArrowRight size="0.8em" /></Link>}
    </div>
);

const CategoryDonutChartPlaceholder = ({ data }) => (
    <div className={styles.chartPlaceholder}>
        <p>Gráfico de Dona (Categorías)</p>
        {/* Aquí iría tu componente de gráfico de dona real */}
        {/* Ejemplo de cómo podrías listar los datos: */}
        <ul>
            {data && data.map(cat => <li key={cat.category}>{cat.category}: {cat.count}</li>)}
        </ul>
    </div>
);

const RecentObjectivesListPlaceholder = ({ objectives }) => {
    const navigate = useNavigate();
    return (
        <div className={styles.listSection}>
            <h3 className={styles.sectionTitle}>Objetivos Recientes</h3>
            {objectives && objectives.length > 0 ? (
                <ul className={styles.recentList}>
                    {objectives.slice(0, 4).map(obj => ( // Mostrar los primeros 4
                        <li key={obj.id_objetivo} className={styles.recentListItem}>
                            <span className={styles.objectiveName}>{obj.nombre}</span>
                            <div className={styles.objectiveMeta}>
                                <span className={styles.objectiveUpdate}>
                                    Act: {new Date(obj.updatedAt).toLocaleDateString()}
                                </span>
                                <span className={styles.objectiveProgress}>
                                    {obj.progreso_calculado}%
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => navigate(`/objectives/${obj.id_objetivo}`)}
                                    aria-label={`Ver detalles de ${obj.nombre}`}
                                    className={styles.detailsArrowButton}
                                >
                                    <FaArrowRight />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className={styles.noDataText}>No hay objetivos recientes.</p>}
            <div className={styles.viewAllContainer}>
                <Button onClick={() => navigate('/mis-objetivos')} variant="outline" size="small">
                    Ver todos los objetivos
                </Button>
            </div>
        </div>
    );
};

const RecentActivityFeedPlaceholder = ({ activities }) => (
    <div className={styles.listSection}>
        <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
        {activities && activities.length > 0 ? (
            <ul className={styles.recentList}>
                {activities.slice(0, 5).map(act => ( // Mostrar las últimas 5 actividades
                    <li key={act.id} className={styles.recentActivityItem}>
                        <span className={styles.activityDescription}>{act.description}</span>
                        <span className={styles.activityTimestamp}>{new Date(act.timestamp).toLocaleString()}</span>
                    </li>
                ))}
            </ul>
        ) : <p className={styles.noDataText}>No hay actividad reciente.</p>}
    </div>
);
// -------------------------------------------------------------------------


function DashboardPage() { // Renombrado de NewDashboardPage si este es el principal
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

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulación de llamadas a API.
            // Deberás crear estos endpoints en tu backend y funciones en apiService.js
            // const summary = await api.getDashboardSummary(); // Endpoint para las 4 tarjetas
            // const objectivesPreview = await api.getDashboardRecentObjectives({ limit: 4 });
            // const activities = await api.getDashboardRecentActivities({ limit: 5 });
            
            // ------ DATOS DE EJEMPLO HASTA QUE EL BACKEND ESTÉ LISTO ------
            await new Promise(resolve => setTimeout(resolve, 700)); // Simular delay
            
            setSummaryData({
                totalObjectives: 30,
                statusCounts: { "Completado": 12, "En Progreso": 10, "Pendiente": 8 },
                averageProgress: 72,
                dueSoonCount: 4,
                categoryDistribution: [
                    { name: 'Salud', value: 8 }, 
                    { name: 'Finanzas', value: 10 },
                    { name: 'Desarrollo personal', value: 7 }, 
                    { name: 'Otros', value: 5 }
                ]
            });
            setRecentObjectives([
                { id_objetivo: 1, nombre: 'Maratón de Valencia 2025', updatedAt: '2025-05-20T10:00:00Z', progreso_calculado: 60 },
                { id_objetivo: 2, nombre: 'Leer "Atomic Habits"', updatedAt: '2025-05-22T12:30:00Z', progreso_calculado: 100 },
                { id_objetivo: 3, nombre: 'Curso de Node.js Avanzado', updatedAt: '2025-05-24T09:15:00Z', progreso_calculado: 35 },
            ]);
            setRecentActivities([
                { id: 'a1', description: "Progreso actualizado para 'Maratón de Valencia'", timestamp: new Date().toISOString() },
                { id: 'a2', description: "Nuevo objetivo creado: 'Aprender Docker'", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
                { id: 'a3', description: "'Leer \"Atomic Habits\"' marcado como Completado", timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
            ]);
            // ------ FIN DATOS DE EJEMPLO ------

        } catch (err) {
            console.error("DashboardPage: Error al cargar datos del dashboard:", err);
            const errorMessage = err.data?.message || err.message || "No se pudieron cargar los datos del panel de control.";
            setError(errorMessage);
            // toast.error(errorMessage); // Ya apiService podría estar mostrando toasts
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className={styles.dashboardLoadingState}>
                <LoadingSpinner size="large" text="Cargando tu Panel de Control..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboardErrorState}>
                <p className={styles.errorMessageText}>Error: {error}</p>
                <Button onClick={fetchDashboardData} variant="secondary">Reintentar</Button>
            </div>
        );
    }

    // Preparar datos para las Stats Cards
    const totalObjectivesText = `${summaryData.totalObjectives} en total`;
    const statusDetails = summaryData.statusCounts 
        ? Object.entries(summaryData.statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(' | ')
        : 'No disponible';

    return (
        <div className={styles.dashboardPageLayout}>
            {/* Fila Superior de 4 Stats Cards */}
            <section className={styles.statsRowContainer}>
                <StatsCard 
                    title="Mis Objetivos"
                    value={totalObjectivesText}
                    details={statusDetails}
                    linkTo="/mis-objetivos"
                    linkText="Ver Todos"
                    icon={<FaClipboardList size="1.5em" />}
                />
                <StatsCard 
                    title="Progreso Promedio"
                    value={`${summaryData.averageProgress}%`}
                    details="De objetivos activos"
                    // linkTo="/analisis/progreso" // Opcional
                    icon={<FaChartBar size="1.5em" />}
                />
                <StatsCard 
                    title="Próximos a Vencer"
                    value={`${summaryData.dueSoonCount} objetivos`}
                    details="En los próximos 7 días"
                    linkTo="/mis-objetivos?filtro=vencimiento" // Opcional: link con filtro
                    icon={<FaClock size="1.5em" />}
                />
                <StatsCard 
                    title="Categorías"
                    // El valor podría ser el número de categorías o no mostrar valor numérico aquí
                    // details="Distribución de tus objetivos" 
                    linkTo="/analisis" // O una sección específica de análisis de categorías
                    linkText="Ver Análisis"
                    icon={<FaChartPie size="1.5em" />}
                >
                    {/* Aquí renderizarías el CategoryDonutChartPlaceholder (o el real) */}
                    <CategoryDonutChartPlaceholder data={summaryData.categoryDistribution} />
                </StatsCard>
            </section>

            {/* Secciones Inferiores (Grid de 2 columnas) */}
            <section className={styles.bottomSectionsGrid}>
                <div className={styles.objectivesPreviewWrapper}>
                    <RecentObjectivesListPlaceholder objectives={recentObjectives} />
                </div>
                <div className={styles.activityFeedWrapper}>
                    <RecentActivityFeedPlaceholder activities={recentActivities} />
                </div>
            </section>
        </div>
    );
}

export default DashboardPage; // Renombrado a DashboardPage consistentemente