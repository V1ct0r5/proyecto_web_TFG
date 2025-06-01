import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styles from './AnalysisPage.module.css';
import api from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatsCard from '../components/objetivos/StatsCard';
import { FaClipboardList, FaChartLine, FaLayerGroup, FaArrowTrendUp, FaArrowTrendDown, FaMinus } from 'react-icons/fa6';

import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import ObjectiveStatusChart from '../components/charts/ObjectiveStatusChart';
import MonthlyProgressChart from '../components/charts/MonthlyProgressChart';
import ObjectiveProgressBarChart from '../components/charts/ObjectiveProgressBarChart';
import CategoryAverageProgressBarChart from '../components/charts/CategoryAverageProgressBarChart';
import RankedObjectivesList from '../components/analysis/RankedObjectivesList';
import CategoryObjectivesCard from '../components/analysis/CategoryObjectivesCard';

function AnalysisPage() {
    const [summaryStats, setSummaryStats] = useState({
        totalObjectives: 0, activeObjectives: 0, completedObjectives: 0,
        averageProgress: 0, categoryCount: 0, categories: [],
        trend: { type: 'neutral', text: 'Estable' }
    });
    const [rawCategoryDistribution, setRawCategoryDistribution] = useState([]);
    const [rawObjectiveStatus, setRawObjectiveStatus] = useState([]);
    const [rawMonthlyProgress, setRawMonthlyProgress] = useState([]);
    const [rawObjectivesProgressData, setRawObjectivesProgressData] = useState([]);
    const [topProgressObjectives, setTopProgressObjectives] = useState([]);
    const [lowProgressObjectives, setLowProgressObjectives] = useState([]);
    const [rawCategoryAverageProgress, setRawCategoryAverageProgress] = useState([]);
    const [detailedObjectivesByCategory, setDetailedObjectivesByCategory] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timePeriod, setTimePeriod] = useState('3months');
    const [activeTab, setActiveTab] = useState('general');

    const timePeriodOptions = [
        { value: '1month', label: 'Último mes' },
        { value: '3months', label: 'Últimos 3 meses' },
        { value: '6months', label: 'Últimos 6 meses' },
        { value: '1year', label: 'Último año' },
        { value: 'all', label: 'Desde el inicio' },
    ];

    const categoryColorsRef = useRef({});
    const getCategoryColor = useCallback((categoryName, index, allCategoriesSource) => {
        const allCategories = allCategoriesSource || summaryStats.categories || [];
        if (!categoryName) return '#cccccc';
        if (categoryColorsRef.current[categoryName] && allCategories.some(c => c.name === categoryName)) {
            return categoryColorsRef.current[categoryName];
        }
        const baseColors = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#6366F1', '#22D3EE'];
        const catIndex = allCategories.findIndex(c => c.name === categoryName);
        const color = baseColors[(catIndex !== -1 ? catIndex : index) % baseColors.length];
        if (categoryName) {
            categoryColorsRef.current[categoryName] = color;
        }
        return color;
    }, [summaryStats.categories]);

    const getStatusColorForChart = useCallback((statusName) => {
         const statusColorMap = {
            'En progreso': 'rgba(54, 162, 235, 0.8)', 'Completado': 'rgba(75, 192, 192, 0.8)',
            'Pendiente': 'rgba(255, 206, 86, 0.8)', 'Fallido': 'rgba(255, 99, 132, 0.8)',
            'Archivado': 'rgba(153, 102, 255, 0.8)', 'No Iniciados': 'rgba(201, 203, 207, 0.8)'
        };
        return statusColorMap[statusName] || 'rgba(201, 203, 207, 0.8)';
    }, []);

    const fetchAllGeneralDataAPI = useCallback(async (period) => {
        const params = { period };
        return Promise.allSettled([
            api.getAnalysisSummary(params), api.getCategoryDistribution(params),
            api.getObjectiveStatusDistribution(params), api.getMonthlyProgress(params)
        ]);
    }, []);

    const fetchObjectivesTabDataAPI = useCallback(async (period) => {
        const params = { period };
        return Promise.allSettled([
            api.getObjectivesProgressChartData(params), api.getRankedObjectives(params)
        ]);
    }, []);

    const fetchCategoriesTabDataAPI = useCallback(async (period) => {
        const params = { period };
        return Promise.allSettled([
            api.getCategoryAverageProgress(params), api.getDetailedObjectivesByCategory(params)
        ]);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setError(null);

            try {
                const summaryResPromise = api.getAnalysisSummary({ period: timePeriod });

                let tabDataPromise;
                if (activeTab === 'general') {
                    tabDataPromise = fetchAllGeneralDataAPI(timePeriod);
                } else if (activeTab === 'byObjective') {
                    tabDataPromise = fetchObjectivesTabDataAPI(timePeriod);
                } else if (activeTab === 'byCategory') {
                    tabDataPromise = fetchCategoriesTabDataAPI(timePeriod);
                }

                const summaryResult = await summaryResPromise;
                if (isMounted && summaryResult) {
                    setSummaryStats(summaryResult);
                } else if (isMounted) {
                    throw new Error("No se pudo cargar el resumen de estadísticas inicial.");
                }

                if (tabDataPromise) {
                    if (activeTab === 'general') {
                        const [, catDistRes, statusRes, monthlyRes] = await tabDataPromise;
                        if (isMounted) {
                            if (catDistRes.status === 'fulfilled' && catDistRes.value) setRawCategoryDistribution(catDistRes.value);
                            if (statusRes.status === 'fulfilled' && statusRes.value) setRawObjectiveStatus(statusRes.value);
                            if (monthlyRes.status === 'fulfilled' && monthlyRes.value) setRawMonthlyProgress(monthlyRes.value);
                        }
                    } else if (activeTab === 'byObjective') {
                        const [objProgressRes, rankedRes] = await tabDataPromise;
                        if (isMounted) {
                            if (objProgressRes.status === 'fulfilled' && objProgressRes.value) setRawObjectivesProgressData(objProgressRes.value);
                            if (rankedRes.status === 'fulfilled' && rankedRes.value) {
                                setTopProgressObjectives(rankedRes.value.top || []);
                                setLowProgressObjectives(rankedRes.value.low || []);
                            }
                        }
                    } else if (activeTab === 'byCategory') {
                        const [catAvgProgressRes, detailedByCatRes] = await tabDataPromise;
                        if (isMounted) {
                            if (catAvgProgressRes.status === 'fulfilled' && catAvgProgressRes.value) setRawCategoryAverageProgress(catAvgProgressRes.value);
                            if (detailedByCatRes.status === 'fulfilled' && detailedByCatRes.value) setDetailedObjectivesByCategory(detailedByCatRes.value);
                        }
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "No se pudieron cargar los datos de análisis.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [activeTab, timePeriod, fetchAllGeneralDataAPI, fetchObjectivesTabDataAPI, fetchCategoriesTabDataAPI]);

    const categoryDistribution = useMemo(() =>
        (rawCategoryDistribution || []).map((item, idx) => ({ ...item, color: getCategoryColor(item.name, idx, summaryStats.categories) }))
    , [rawCategoryDistribution, getCategoryColor, summaryStats.categories]);

    const objectiveStatus = useMemo(() =>
        (rawObjectiveStatus || []).map((item) => ({ ...item, color: getStatusColorForChart(item.name) }))
    , [rawObjectiveStatus, getStatusColorForChart]);

    const objectivesProgressData = useMemo(() =>
        (rawObjectivesProgressData || []).map((item, idx) => ({ ...item, color: getCategoryColor(item.category, idx, summaryStats.categories) }))
    , [rawObjectivesProgressData, getCategoryColor, summaryStats.categories]);

    const categoryAverageProgress = useMemo(() =>
        (rawCategoryAverageProgress || []).map((item, idx) => ({ ...item, color: getCategoryColor(item.categoryName, idx, summaryStats.categories) }))
    , [rawCategoryAverageProgress, getCategoryColor, summaryStats.categories]);

    const coloredTopProgressObjectives = useMemo(() =>
        (topProgressObjectives || []).map((obj, idx) => ({...obj, color: getCategoryColor(obj.tipo_objetivo, idx, summaryStats.categories)}))
    , [topProgressObjectives, getCategoryColor, summaryStats.categories]);

    const coloredLowProgressObjectives = useMemo(() =>
        (lowProgressObjectives || []).map((obj, idx) => ({...obj, color: getCategoryColor(obj.tipo_objetivo, idx, summaryStats.categories)}))
    , [lowProgressObjectives, getCategoryColor, summaryStats.categories]);

    const coloredDetailedObjectivesByCategory = useMemo(() =>
        (detailedObjectivesByCategory || []).map((catData, catIdx) => ({
            ...catData,
            color: getCategoryColor(catData.categoryName, catIdx, summaryStats.categories),
            objectives: (catData.objectives || []).map((obj) => ({
                ...obj,
                color: getCategoryColor(catData.categoryName, catIdx, summaryStats.categories)
            }))
        }))
    , [detailedObjectivesByCategory, getCategoryColor, summaryStats.categories]);

    const renderTrendIcon = () => {
        switch (summaryStats.trend?.type) {
            case 'positive': return <FaArrowTrendUp style={{ color: 'var(--success)' }} />;
            case 'negative': return <FaArrowTrendDown style={{ color: 'var(--destructive)' }} />;
            default: return <FaMinus style={{ color: 'var(--muted-foreground)' }} />;
        }
    };

    const renderCurrentTabContent = () => {
        if (isLoading) {
            return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={`Cargando ${activeTab}...`} /></div>;
        }
        if (error) {
            return <div className={styles.centeredStatus}><p className={styles.errorMessage}>{error}</p><Button onClick={() => {
                const currentPeriod = timePeriod;
                setTimePeriod('');
                setTimeout(() => setTimePeriod(currentPeriod), 0);
            }} className={styles.retryButton}>Reintentar</Button></div>;
        }

        switch (activeTab) {
            case 'general':
                return ( <>
                    <section className={styles.donutChartsRow}>
                        <div className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>Distribución por Categoría</h3>
                            <span className={styles.chartSubtitle}>Número de objetivos por categoría</span>
                            <div className={styles.chartContainer}>
                                <CategoryDonutChart data={categoryDistribution} />
                            </div>
                        </div>
                        <div className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>Estado de Objetivos</h3>
                            <span className={styles.chartSubtitle}>Relación entre objetivos completados y pendientes</span>
                            <div className={styles.chartContainer}>
                                <ObjectiveStatusChart data={objectiveStatus} />
                            </div>
                        </div>
                    </section>
                    <section className={styles.sectionWrapper}>
                        <h3 className={styles.chartTitle}>Progreso Mensual</h3>
                        <span className={styles.chartSubtitle}>Tendencia de progreso por categoría en los últimos meses</span>
                        <div className={`${styles.chartContainer} ${styles.chartContainerFullWidth}`}>
                            <MonthlyProgressChart data={rawMonthlyProgress} />
                        </div>
                    </section>
                </>);
            case 'byCategory':
                return (
                    <>
                        <section className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>Progreso Promedio por Categoría</h3>
                            <span className={styles.chartSubtitle}>Nivel de completado en cada categoría</span>
                            <div className={`${styles.chartContainer} ${styles.chartContainerFullWidth}`}>
                                <CategoryAverageProgressBarChart data={categoryAverageProgress} />
                            </div>
                        </section>
                        <section className={styles.categoriesDetailGrid}>
                            {coloredDetailedObjectivesByCategory.length > 0 ? coloredDetailedObjectivesByCategory.map((catData, index) => (
                                <CategoryObjectivesCard
                                    key={catData.categoryName || index}
                                    categoryName={catData.categoryName}
                                    objectiveCount={catData.objectiveCount}
                                    objectives={catData.objectives}
                                    color={catData.color}
                                />
                            )) : (!isLoading && <div className={styles.sectionWrapper}><p className={styles.noDataText}>No hay objetivos detallados por categoría para mostrar.</p></div>)}
                        </section>
                    </>
                );
            case 'byObjective':
                return ( <>
                    <section className={styles.sectionWrapper}>
                        <h3 className={styles.chartTitle}>Progreso por Objetivo</h3>
                        <span className={styles.chartSubtitle}>Nivel de completado de cada objetivo individual</span>
                        <div className={`${styles.chartContainer} ${styles.chartContainerFullWidth}`}>
                            <ObjectiveProgressBarChart data={objectivesProgressData} />
                        </div>
                    </section>
                    <section className={styles.rankedObjectivesGrid}>
                        <RankedObjectivesList title="Objetivos con Mayor Progreso" objectives={coloredTopProgressObjectives} noDataMessage="No hay objetivos con progreso significativo." />
                        <RankedObjectivesList title="Objetivos con Menor Progreso" objectives={coloredLowProgressObjectives} noDataMessage="Todos los objetivos tienen buen progreso o no hay datos." />
                    </section>
                </>);
            default:
                return <div className={styles.sectionWrapper}><p>Selecciona una pestaña para ver el análisis.</p></div>;
        }
    };

    return (
        <div className={styles.analysisPageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Análisis y Tendencias</h1>
                <div className={styles.timeFilterContainer}>
                    <Input type="select" id="time-period-filter" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className={styles.timeFilterSelect}>
                        {timePeriodOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                    </Input>
                </div>
            </div>

            <section className={styles.statsRow}>
                <StatsCard title="Objetivos Totales" value={summaryStats.totalObjectives.toString()} icon={<FaClipboardList />}><p className={styles.statsDetailText}>Activos: {summaryStats.activeObjectives}</p><p className={styles.statsDetailText}>Completados: {summaryStats.completedObjectives}</p></StatsCard>
                <StatsCard title="Progreso Promedio" value={`${Math.round(summaryStats.averageProgress)}%`} icon={<FaChartLine />} />
                <StatsCard title="Categorías" value={summaryStats.categoryCount.toString()} icon={<FaLayerGroup />}>
                    <div className={styles.categoryListInCard}>
                        {summaryStats.categories.slice(0, 3).map((cat, index) => (<span key={cat.name} className={styles.categoryChip} style={{ backgroundColor: getCategoryColor(cat.name, index, summaryStats.categories) }}>{cat.name}</span>))}
                        {summaryStats.categories.length > 3 && <span className={styles.categoryChipMore}>...y {summaryStats.categories.length - 3} más</span>}
                    </div>
                </StatsCard>
                <StatsCard title="Tendencia" value={summaryStats.trend?.text} icon={renderTrendIcon()}><p className={styles.statsDetailTextSmall}>Basado en el progreso de los últimos 30 días</p></StatsCard>
            </section>

            <div className={styles.tabsContainer}>
                <Button data-active={activeTab === 'general'} onClick={() => setActiveTab('general')} className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTabButton : ''}`}>Vista General</Button>
                <Button data-active={activeTab === 'byCategory'} onClick={() => setActiveTab('byCategory')} className={`${styles.tabButton} ${activeTab === 'byCategory' ? styles.activeTabButton : ''}`}>Por Categorías</Button>
                <Button data-active={activeTab === 'byObjective'} onClick={() => setActiveTab('byObjective')} className={`${styles.tabButton} ${activeTab === 'byObjective' ? styles.activeTabButton : ''}`}>Por Objetivos</Button>
            </div>

            <div className={styles.tabContent}>
                {renderCurrentTabContent()}
            </div>
        </div>
    );
}
export default AnalysisPage;