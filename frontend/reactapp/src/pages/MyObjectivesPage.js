// frontend/reactapp/src/pages/MyObjectivesPage.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/apiService';

// Componentes
import ObjetivoCard from '../components/objetivos/ObjetivoCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormGroup from '../components/ui/FormGroup'; // Se vuelve a usar FormGroup
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './MyObjectivesPage.module.css';

const INITIAL_DISPLAY_LIMIT = 6;

// Opciones de filtros que se mapean a los valores que espera el backend
const CATEGORY_OPTIONS = [
    { value: 'all', key: 'myObjectives.categories.all' },
    { value: 'HEALTH', key: 'categories.health' },
    { value: 'FINANCE', key: 'categories.finance' },
    { value: 'PERSONAL_DEV', key: 'categories.personalDevelopment' },
    { value: 'RELATIONSHIPS', key: 'categories.relationships' },
    { value: 'CAREER', key: 'categories.career' },
    { value: 'OTHER', key: 'categories.other' }
];

const SORT_BY_OPTIONS = [
    { value: "recent", key: "myObjectives.sort.recent" },
    { value: "oldest", key: "myObjectives.sort.oldest" },
    { value: "nameAsc", key: "myObjectives.sort.nameAsc" },
    { value: "nameDesc", key: "myObjectives.sort.nameDesc" },
    { value: "progressAsc", key: "myObjectives.sort.progressAsc" },
    { value: "progressDesc", key: "myObjectives.sort.progressDesc" },
    { value: "dateAsc", key: "myObjectives.sort.dateAsc" },
];

function MyObjectivesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [objectives, setObjectives] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'all',
        sortBy: 'recent',
        includeArchived: false,
    });
    const [showAllObjectives, setShowAllObjectives] = useState(false);

    const fetchObjectives = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getObjectives(filters);
            setObjectives(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || t('errors.objectivesLoadError'));
            setObjectives([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters, t]);

    useEffect(() => {
        fetchObjectives();
    }, [fetchObjectives]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setShowAllObjectives(false);
    };

    const handleObjectiveChange = useCallback(() => {
        toast.info(t('toast.listUpdated'));
        fetchObjectives();
    }, [fetchObjectives, t]);

    const objectivesToRender = showAllObjectives ? objectives : objectives.slice(0, INITIAL_DISPLAY_LIMIT);

    if (isLoading) {
        return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingObjectives')} /></div>;
    }
    
    if (error) {
        return <div className={styles.centeredStatus}><p className={styles.errorMessage}>{t('common.errorPrefix', { error })}</p><Button onClick={fetchObjectives} variant="outline">{t('common.retryLoad')}</Button></div>;
    }

    // El JSX ahora refleja la estructura y clases de tu versión original
    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.pageHeader}>
                <h1>{t('pageTitles.myObjectives')}</h1>
                <Button onClick={() => navigate('/objectives')} className={styles.createButtonTopRight} variant="primary">{t('myObjectives.addNewObjective')}</Button>
            </div>
            
            <div className={styles.topControlBar}>
                <FormGroup label={t('myObjectives.labels.search')} htmlFor="search-term">
                    <Input type="text" id="search-term" name="searchTerm" placeholder={t('myObjectives.searchPlaceholder')} value={filters.searchTerm} onChange={handleFilterChange} />
                </FormGroup>
                <FormGroup label={t('myObjectives.labels.category')} htmlFor="filter-category">
                    <Input type="select" id="filter-category" name="category" value={filters.category} onChange={handleFilterChange}>
                        {CATEGORY_OPTIONS.map(option => (<option key={option.value} value={option.value}>{t(option.key)}</option>))}
                    </Input>
                </FormGroup>
                <FormGroup label={t('myObjectives.labels.sortBy')} htmlFor="sort-by">
                    <Input type="select" id="sort-by" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                        {SORT_BY_OPTIONS.map(option => (<option key={option.value} value={option.value}>{t(option.key)}</option>))}
                    </Input>
                </FormGroup>
                <FormGroup className={styles.checkboxGroup}>
                    <input type="checkbox" id="include-archived" name="includeArchived" className={styles.hiddenCheckbox} checked={filters.includeArchived} onChange={handleFilterChange} />
                    <label htmlFor="include-archived" className={styles.checkboxLabel}>{t('myObjectives.labels.includeArchived')}</label>
                </FormGroup>
            </div>

            {objectives.length === 0 ? (
                <div className={styles.centeredStatus}>
                    <p className={styles.noGoalsMessage}>{filters.searchTerm || filters.category !== 'all' || filters.includeArchived ? t('myObjectives.noResults') : t('myObjectives.noObjectives')}</p>
                </div>
            ) : (
                <>
                    <div className={`${styles.goalsGrid} ${showAllObjectives ? styles.expandedGrid : ''}`}>
                        {objectivesToRender.map((objective) => (
                            <ObjetivoCard 
                                key={objective.id} 
                                objective={objective} 
                                onObjectiveArchived={handleObjectiveChange}
                            />
                        ))}
                    </div>
                    {objectives.length > INITIAL_DISPLAY_LIMIT && (
                         <div className={styles.viewMoreContainer}>
                            <Button className={styles.toggleViewButton} onClick={() => setShowAllObjectives(prev => !prev)} variant="outline">
                                {showAllObjectives ? t('myObjectives.viewLess') : t('myObjectives.viewMore', { count: objectives.length - INITIAL_DISPLAY_LIMIT, total: objectives.length })}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MyObjectivesPage;