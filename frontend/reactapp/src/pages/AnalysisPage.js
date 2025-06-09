import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styles from './AnalysisPage.module.css';
import api from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatsCard from '../components/objetivos/StatsCard';
import { FaLayerGroup, FaArrowTrendUp, FaArrowTrendDown, FaMinus } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import ObjectiveStatusChart from '../components/charts/ObjectiveStatusChart';
import MonthlyProgressChart from '../components/charts/MonthlyProgressChart';
import ObjectiveProgressBarChart from '../components/charts/ObjectiveProgressBarChart';
import CategoryAverageProgressBarChart from '../components/charts/CategoryAverageProgressBarChart';
import RankedObjectivesList from '../components/analysis/RankedObjectivesList';
import CategoryObjectivesCard from '../components/analysis/CategoryObjectivesCard';

const categoryNameToKeyMap = {
    'Finanzas': 'categories.finance',
    'Salud': 'categories.health',
    'Desarrollo personal': 'categories.personalDevelopment',
    'Relaciones': 'categories.relationships',
    'Carrera profesional': 'categories.career',
    'Otros': 'categories.other'
};

const statusNameToKeyMap = {
    'En progreso': 'status.inProgress',
    'Completado': 'status.completed',
    'Pendiente': 'status.pending',
    'Fallido': 'status.failed',
    'Archivado': 'status.archived',
    'No Iniciados': 'status.notStarted'
};

function AnalysisPage() {
    const { t } = useTranslation();
    
    // --- CORRECCIÓN: Actualizar estado inicial de trend para usar una clave de traducción ---
    const [summaryStats, setSummaryStats] = useState({
        totalObjectives: 0, activeObjectives: 0, completedObjectives: 0,
        averageProgress: 0, categoryCount: 0, categories: [],
        trend: { type: 'neutral', textKey: 'analysis.trends.stable' }
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

    const timePeriodOptions = useMemo(() => [
        { value: '1month', key: 'analysis.timePeriods.1month' },
        { value: '3months', key: 'analysis.timePeriods.3months' },
        { value: '6months', key: 'analysis.timePeriods.6months' },
        { value: '1year', key: 'analysis.timePeriods.1year' },
        { value: 'all', key: 'analysis.timePeriods.all' },
    ], []);

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
            api.getCategoryDistribution(params),
            api.getObjectiveStatusDistribution(params), 
            api.getMonthlyProgress(params)
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
                const summaryResult = await api.getAnalysisSummary({ period: timePeriod });
                 if (isMounted) {
                    setSummaryStats(prev => ({...prev, ...summaryResult}));
                } else {
                     throw new Error(t('toast.summaryLoadError'));
                }

                let tabDataPromise;
                if (activeTab === 'general') {
                    tabDataPromise = fetchAllGeneralDataAPI(timePeriod);
                } else if (activeTab === 'byObjective') {
                    tabDataPromise = fetchObjectivesTabDataAPI(timePeriod);
                } else if (activeTab === 'byCategory') {
                    tabDataPromise = fetchCategoriesTabDataAPI(timePeriod);
                }
                
                if (tabDataPromise) {
                     const results = await tabDataPromise;
                     if(isMounted) {
                        if (activeTab === 'general') {
                            const [catDistRes, statusRes, monthlyRes] = results;
                            if (catDistRes.status === 'fulfilled' && catDistRes.value) setRawCategoryDistribution(catDistRes.value);
                            if (statusRes.status === 'fulfilled' && statusRes.value) setRawObjectiveStatus(statusRes.value);
                            if (monthlyRes.status === 'fulfilled' && monthlyRes.value) setRawMonthlyProgress(monthlyRes.value);
                        } else if (activeTab === 'byObjective') {
                            const [objProgressRes, rankedRes] = results;
                             if (objProgressRes.status === 'fulfilled' && objProgressRes.value) setRawObjectivesProgressData(objProgressRes.value);
                            if (rankedRes.status === 'fulfilled' && rankedRes.value) {
                                setTopProgressObjectives(rankedRes.value.top || []);
                                setLowProgressObjectives(rankedRes.value.low || []);
                            }
                        } else if (activeTab === 'byCategory') {
                            const [catAvgProgressRes, detailedByCatRes] = results;
                             if (catAvgProgressRes.status === 'fulfilled' && catAvgProgressRes.value) setRawCategoryAverageProgress(catAvgProgressRes.value);
                            if (detailedByCatRes.status === 'fulfilled' && detailedByCatRes.value) setDetailedObjectivesByCategory(detailedByCatRes.value);
                        }
                     }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || t('toast.analysisLoadError'));
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [activeTab, timePeriod, fetchAllGeneralDataAPI, fetchObjectivesTabDataAPI, fetchCategoriesTabDataAPI, t]);
    
    const categoryDistribution = useMemo(() =>
        (rawCategoryDistribution || []).map((item, idx) => ({
            ...item,
            name: t(item.nameKey || item.name),
            color: getCategoryColor(item.name, idx)
        }))
    , [rawCategoryDistribution, getCategoryColor, t]);

    const objectiveStatus = useMemo(() =>
        (rawObjectiveStatus || []).map((item) => ({
            ...item,
            name: t(item.nameKey || item.name),
            color: getStatusColorForChart(item.name)
        }))
    , [rawObjectiveStatus, getStatusColorForChart, t]);
    
    const objectivesProgressData = useMemo(() =>
        (rawObjectivesProgressData || []).map((item, idx) => ({
            ...item,
            color: getCategoryColor(item.category, idx, summaryStats.categories)
        }))
    , [rawObjectivesProgressData, getCategoryColor, summaryStats.categories]);

    const categoryAverageProgress = useMemo(() =>
        (rawCategoryAverageProgress || []).map((item, idx) => ({
            ...item,
            categoryName: t(categoryNameToKeyMap[item.categoryName] || item.categoryName),
            color: getCategoryColor(item.categoryName, idx, summaryStats.categories)
        }))
    , [rawCategoryAverageProgress, getCategoryColor, summaryStats.categories, t]);

    const coloredTopProgressObjectives = useMemo(() =>
        (topProgressObjectives || []).map((obj, idx) => ({
            ...obj,
            tipo_objetivo: t(categoryNameToKeyMap[obj.tipo_objetivo] || obj.tipo_objetivo),
            color: getCategoryColor(obj.tipo_objetivo, idx, summaryStats.categories)
        }))
    , [topProgressObjectives, getCategoryColor, summaryStats.categories, t]);

    const coloredLowProgressObjectives = useMemo(() =>
        (lowProgressObjectives || []).map((obj, idx) => ({
            ...obj,
            tipo_objetivo: t(categoryNameToKeyMap[obj.tipo_objetivo] || obj.tipo_objetivo),
            color: getCategoryColor(obj.tipo_objetivo, idx, summaryStats.categories)
        }))
    , [lowProgressObjectives, getCategoryColor, summaryStats.categories, t]);

    const coloredDetailedObjectivesByCategory = useMemo(() =>
        (detailedObjectivesByCategory || []).map((catData, catIdx) => ({
            ...catData,
            categoryName: t(categoryNameToKeyMap[catData.categoryName] || catData.categoryName),
            color: getCategoryColor(catData.categoryName, catIdx, summaryStats.categories),
            objectives: (catData.objectives || []).map((obj) => ({
                ...obj,
                color: getCategoryColor(catData.categoryName, catIdx, summaryStats.categories)
            }))
        }))
    , [detailedObjectivesByCategory, getCategoryColor, summaryStats.categories, t]);

    const dynamicTrendSubtitle = useMemo(() => {
        const selectedOption = timePeriodOptions.find(option => option.value === timePeriod);
        const periodText = selectedOption ? t(selectedOption.key) : '';
        return t('analysis.stats.trendSubtitle', { period: periodText });
    }, [timePeriod, timePeriodOptions, t]);


    const renderCurrentTabContent = () => {
        const translatedTabName = t(`analysis.tabs.${activeTab}`);
        if (isLoading) {
            return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingTab', { tab: translatedTabName })} /></div>;
        }
        if (error) {
            return <div className={styles.centeredStatus}><p className={styles.errorMessage}>{error}</p><Button onClick={() => {
                const currentPeriod = timePeriod;
                setTimePeriod('');
                setTimeout(() => setTimePeriod(currentPeriod), 0);
            }} className={styles.retryButton}>{t('common.retry')}</Button></div>;
        }

        switch (activeTab) {
            case 'general':
                return (<>
                    <section className={styles.donutChartsRow}>
                        <div className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>{t('analysis.chartTitles.categoryDistribution')}</h3>
                            <span className={styles.chartSubtitle}>{t('analysis.chartTitles.categoryDistributionSubtitle')}</span>
                            <div className={styles.chartContainer}>
                                <CategoryDonutChart data={categoryDistribution} />
                            </div>
                        </div>
                        <div className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>{t('analysis.chartTitles.objectiveStatus')}</h3>
                            <span className={styles.chartSubtitle}>{t('analysis.chartTitles.objectiveStatusSubtitle')}</span>
                            <div className={styles.chartContainer}>
                                <ObjectiveStatusChart data={objectiveStatus} />
                            </div>
                        </div>
                    </section>
                    <section className={styles.sectionWrapper}>
                        <h3 className={styles.chartTitle}>{t('analysis.chartTitles.monthlyProgress')}</h3>
                        <span className={styles.chartSubtitle}>{t('analysis.chartTitles.monthlyProgressSubtitle')}</span>
                        <div className={`${styles.chartContainer} ${styles.chartContainerFullWidth}`}>
                            <MonthlyProgressChart data={rawMonthlyProgress} />
                        </div>
                    </section>
                </>);
            case 'byCategory':
                return (
                    <>
                        <section className={styles.sectionWrapper}>
                            <h3 className={styles.chartTitle}>{t('analysis.chartTitles.categoryAverageProgress')}</h3>
                            <span className={styles.chartSubtitle}>{t('analysis.chartTitles.categoryAverageProgressSubtitle')}</span>
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
                            )) : (!isLoading && <div className={styles.sectionWrapper}><p className={styles.noDataText}>{t('analysis.noDetailedObjectives')}</p></div>)}
                        </section>
                    </>
                );
            case 'byObjective':
                return (<>
                    <section className={styles.sectionWrapper}>
                        <h3 className={styles.chartTitle}>{t('analysis.chartTitles.objectiveProgress')}</h3>
                        <span className={styles.chartSubtitle}>{t('analysis.chartTitles.objectiveProgressSubtitle')}</span>
                        <div className={`${styles.chartContainer} ${styles.chartContainerFullWidth}`}>
                            <ObjectiveProgressBarChart data={objectivesProgressData} />
                        </div>
                    </section>
                    <section className={styles.rankedObjectivesGrid}>
                        <RankedObjectivesList title={t('analysis.chartTitles.topProgress')} objectives={coloredTopProgressObjectives} noDataMessage={t('analysis.noDataMessages.topProgress')} />
                        <RankedObjectivesList title={t('analysis.chartTitles.lowProgress')} objectives={coloredLowProgressObjectives} noDataMessage={t('analysis.noDataMessages.lowProgress')} />
                    </section>
                </>);
            default:
                return <div className={styles.sectionWrapper}><p>{t('analysis.selectTabPrompt')}</p></div>;
        }
    };

    return (
        <div className={styles.analysisPageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{t('pageTitles.analysisTrends')}</h1>
                <div className={styles.timeFilterContainer}>
                    <Input type="select" id="time-period-filter" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className={styles.timeFilterSelect}>
                        {timePeriodOptions.map(option => (<option key={option.value} value={option.value}>{t(option.key)}</option>))}
                    </Input>
                </div>
            </div>

            <section className={styles.statsRow}>
                <StatsCard title={t('analysis.stats.totalObjectives')} value={summaryStats.totalObjectives.toString()} ><p className={styles.statsDetailText}>{t('analysis.stats.active')}: {summaryStats.activeObjectives}</p><p className={styles.statsDetailText}>{t('analysis.stats.completed')}: {summaryStats.completedObjectives}</p></StatsCard>
                <StatsCard title={t('analysis.stats.averageProgress')} value={`${Math.round(summaryStats.averageProgress)}%`} />
                <StatsCard title={t('analysis.stats.categories')} value={summaryStats.categoryCount.toString()}>
                    <div className={styles.categoryListInCard}>
                        {summaryStats.categories.slice(0, 3).map((cat, index) => (
                            <span key={cat.name} className={styles.categoryChip} style={{ backgroundColor: getCategoryColor(cat.name, index) }}>
                                {t(categoryNameToKeyMap[cat.name] || cat.name)}
                            </span>
                        ))}
                        {summaryStats.categories.length > 3 && <span className={styles.categoryChipMore}>{t('analysis.stats.moreCategories', { count: summaryStats.categories.length - 3 })}</span>}
                    </div>
                </StatsCard>
                
                <StatsCard 
                    title={t('analysis.stats.trend')} 
                    value={summaryStats.trend?.textKey ? t(summaryStats.trend.textKey) : '...'} 
                >
                    <p className={styles.statsDetailTextSmall}>{dynamicTrendSubtitle}</p>
                </StatsCard>

            </section>

            <div className={styles.tabsContainer}>
                <Button
                    onClick={() => setActiveTab('general')}
                    className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTabButton : ''}`}
                >
                    {t('analysis.tabs.general')}
                </Button>
                <Button
                    onClick={() => setActiveTab('byCategory')}
                    className={`${styles.tabButton} ${activeTab === 'byCategory' ? styles.activeTabButton : ''}`}
                >
                    {t('analysis.tabs.byCategory')}
                </Button>
                <Button
                    onClick={() => setActiveTab('byObjective')}
                    className={`${styles.tabButton} ${activeTab === 'byObjective' ? styles.activeTabButton : ''}`}
                >
                    {t('analysis.tabs.byObjective')}
                </Button>
            </div>

            <div className={styles.tabContent}>
                {renderCurrentTabContent()}
            </div>
        </div>
    );
}

export default AnalysisPage;