// frontend/src/pages/MyObjectivesPage.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import api from "../services/apiService";
import ObjetivoCard from "../components/objetivos/ObjetivoCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormGroup from "../components/ui/FormGroup";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import styles from "./MyObjectivesPage.module.css";

function MyObjectivesPage() {
    const { t } = useTranslation();
    const [objetivos, setObjetivos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- CORRECCIÓN: Usar un solo estado para todos los filtros ---
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'all',
        sortBy: 'recientes',
        includeArchived: false,
    });

    const [showAllObjectives, setShowAllObjectives] = useState(false);
    const initialDisplayLimit = 6;
    const navigate = useNavigate();

    const tipoObjetivoOptions = useMemo(() => ([
        { key: 'all', value: 'Todas' }, { key: 'health', value: 'Salud' },
        { key: 'finance', value: 'Finanzas' }, { key: 'personalDevelopment', value: 'Desarrollo personal' },
        { key: 'relationships', value: 'Relaciones' }, { key: 'career', value: 'Carrera profesional' },
        { key: 'other', value: 'Otros' }
    ]), []);

    const sortByOptions = useMemo(() => ([
        { value: "recientes", key: "myObjectives.sort.recent" },
        { value: "antiguos", key: "myObjectives.sort.oldest" },
        { value: "nombreAsc", key: "myObjectives.sort.nameAsc" },
        { value: "nombreDesc", key: "myObjectives.sort.nameDesc" },
        { value: "progresoAsc", key: "myObjectives.sort.progressAsc" },
        { value: "progresoDesc", key: "myObjectives.sort.progressDesc" },
        { value: "fechaFinAsc", key: "myObjectives.sort.dateAsc" },
    ]), [t]);

    const fetchObjetivos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // --- CORRECCIÓN: Llamar a la función correcta con los filtros ---
            const data = await api.getObjectivesFiltered(filters);
            setObjetivos(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || t('errors.objectivesLoadError'));
            setObjetivos([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters, t]); // 'filters' es ahora la única dependencia necesaria

    useEffect(() => {
        fetchObjetivos();
    }, [fetchObjetivos]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    // --- CORRECCIÓN: Un solo callback para refrescar la lista ---
    const handleObjectiveChange = useCallback(() => {
        toast.info(t('toast.listUpdated'));
        fetchObjetivos();
    }, [fetchObjetivos]);

    const objectivesToRender = showAllObjectives ? objetivos : objetivos.slice(0, initialDisplayLimit);

    if (isLoading) return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingObjectives')} /></div>;
    if (error) return <div className={styles.centeredStatus}><p className={styles.errorMessage}>{t('common.errorPrefix', { error: error })}</p><Button onClick={fetchObjetivos} variant="outline">{t('common.retryLoad')}</Button></div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.pageHeader}>
                <h1>{t('pageTitles.myObjectives')}</h1>
                <Button onClick={() => navigate('/objectives/new')} className={styles.createButtonTopRight} variant="primary">{t('myObjectives.addNewObjective')}</Button>
            </div>
            <div className={styles.topControlBar}>
                <FormGroup label={t('myObjectives.labels.search')} htmlFor="search-term">
                    <Input type="text" id="search-term" name="searchTerm" placeholder={t('myObjectives.searchPlaceholder')} value={filters.searchTerm} onChange={handleFilterChange} />
                </FormGroup>
                <FormGroup label={t('myObjectives.labels.category')} htmlFor="filter-category">
                    <Input type="select" id="filter-category" name="category" value={filters.category} onChange={handleFilterChange}>
                        {tipoObjetivoOptions.map(option => (<option key={option.key} value={option.value === 'Todas' ? 'all' : option.value}>{option.key === 'all' ? t('myObjectives.categories.all') : t(`categories.${option.key}`)}</option>))}
                    </Input>
                </FormGroup>
                <FormGroup label={t('myObjectives.labels.sortBy')} htmlFor="sort-by">
                    <Input type="select" id="sort-by" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                        {sortByOptions.map(option => (<option key={option.value} value={option.value}>{t(option.key)}</option>))}
                    </Input>
                </FormGroup>
                <FormGroup className={styles.checkboxGroup}>
                    <input type="checkbox" id="include-archived" name="includeArchived" className={styles.hiddenCheckbox} checked={filters.includeArchived} onChange={handleFilterChange} />
                    <label htmlFor="include-archived" className={styles.checkboxLabel}>{t('myObjectives.labels.includeArchived')}</label>
                </FormGroup>
            </div>
            {objetivos.length === 0 && !isLoading ? (
                <div className={styles.centeredStatus}>
                    <p className={styles.noGoalsMessage}>{filters.searchTerm || filters.category !== 'all' || filters.includeArchived ? t('myObjectives.noResults') : t('myObjectives.noObjectives')}</p>
                </div>
            ) : (<>
                {error && <p className={styles.errorMessageTop}>{t('common.updateErrorPrefix', { error: error })} <Button onClick={fetchObjetivos} size="small" variant="outline">{t('common.retry')}</Button></p>}
                <div className={`${styles.goalsGrid} ${showAllObjectives ? styles.expandedGrid : ''}`}>
                    {objectivesToRender.map((objetivo) => (
                        <ObjetivoCard 
                            key={objetivo.id_objetivo || objetivo.id} 
                            objective={objetivo} 
                            onObjectiveChange={handleObjectiveChange}
                        />
                    ))}
                </div>
                {objetivos.length > initialDisplayLimit && !showAllObjectives && (
                    <div className={styles.viewMoreContainer}>
                        <Button className={styles.toggleViewButton} onClick={() => setShowAllObjectives(true)} variant="outline">{t('myObjectives.viewMore', { count: objetivos.length - initialDisplayLimit, total: objetivos.length })}</Button>
                    </div>
                )}
                {showAllObjectives && objetivos.length > initialDisplayLimit && (
                    <div className={styles.viewMoreContainer}>
                        <Button className={styles.toggleViewButton} onClick={() => setShowAllObjectives(false)} variant="outline">{t('myObjectives.viewLess')}</Button>
                    </div>
                )}
            </>)}
        </div>
    );
}

export default MyObjectivesPage;