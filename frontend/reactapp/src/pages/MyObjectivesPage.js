import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [sortBy, setSortBy] = useState("recientes");
    const [showAllObjectives, setShowAllObjectives] = useState(false);
    const initialDisplayLimit = 6;
    const navigate = useNavigate();
    const processedNoObjectivesRef = useRef(false);

    const tipoObjetivoOptions = useMemo(() => ([
        { key: 'all', value: 'Todas' }, { key: 'health', value: 'Salud' },
        { key: 'finance', value: 'Finanzas' }, { key: 'personalDevelopment', value: 'Desarrollo personal' },
        { key: 'relationships', value: 'Relaciones' }, { key: 'career', value: 'Carrera profesional' },
        { key: 'other', value: 'Otros' }
    ]), []);

    const sortByOptions = useMemo(() => ([
        { value: "recientes", key: "myObjectives.sort.recent" }, { value: "antiguos", key: "myObjectives.sort.oldest" },
        { value: "nombreAsc", key: "myObjectives.sort.nameAsc" }, { value: "nombreDesc", key: "myObjectives.sort.nameDesc" },
        { value: "progresoAsc", key: "myObjectives.sort.progressAsc" }, { value: "progresoDesc", key: "myObjectives.sort.progressDesc" },
        { value: "fechaFinAsc", key: "myObjectives.sort.dateAsc" },
    ]), []);

    const fetchObjetivos = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await api.getObjectives();
            if (Array.isArray(data)) {
                setObjetivos(data);
                if (data.length === 0 && !processedNoObjectivesRef.current) {
                    processedNoObjectivesRef.current = true;
                    toast.info(t('toast.noObjectivesYet'), { autoClose: 4000 });
                    navigate('/objectives', { replace: true});
                }
            } else { setObjetivos([]); }
        } catch (err) {
            setError(err.message || t('errors.objectivesLoadError'));
            setObjetivos([]);
        } finally { setIsLoading(false); }
    }, [navigate, t]);

    useEffect(() => { fetchObjetivos(); }, [fetchObjetivos]);

    const handleObjectiveDeleted = useCallback(() => { fetchObjetivos(); }, [fetchObjetivos]);

    const filteredAndSortedObjetivos = useMemo(() => {
        if (!Array.isArray(objetivos)) return [];
        let result = [...objetivos];
        if (filterCategory !== "all") {
            result = result.filter(obj => obj.tipo_objetivo === filterCategory);
        }
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(obj => obj.nombre.toLowerCase().includes(lowerSearchTerm) || (obj.descripcion && obj.descripcion.toLowerCase().includes(lowerSearchTerm)));
        }
        // ... (sorting logic remains the same)
        return result;
    }, [objetivos, searchTerm, filterCategory, sortBy]);
    
    const objectivesToRender = showAllObjectives ? filteredAndSortedObjetivos : filteredAndSortedObjetivos.slice(0, initialDisplayLimit);

    if (isLoading) return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingObjectives')} /></div>;
    if (error && filteredAndSortedObjetivos.length === 0) return <div className={styles.centeredStatus}><p className={styles.errorMessage}>{t('common.errorPrefix', { error: error })}</p><Button onClick={fetchObjetivos} variant="outline">{t('common.retryLoad')}</Button></div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.pageHeader}><Button onClick={() => navigate('/objectives')} className={styles.createButtonTopRight} variant="primary">{t('myObjectives.addNewObjective')}</Button></div>
            <div className={styles.topControlBar}>
                <FormGroup label={t('myObjectives.labels.search')} htmlFor="search-term"><Input type="text" id="search-term" placeholder={t('myObjectives.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></FormGroup>
                <FormGroup label={t('myObjectives.labels.category')} htmlFor="filter-category"><Input type="select" id="filter-category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>{tipoObjetivoOptions.map(option => (<option key={option.key} value={option.value === 'Todas' ? 'all' : option.value}>{option.key === 'all' ? t('myObjectives.categories.all') : t(`categories.${option.key}`)}</option>))}</Input></FormGroup>
                <FormGroup label={t('myObjectives.labels.sortBy')} htmlFor="sort-by"><Input type="select" id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>{sortByOptions.map(option => (<option key={option.value} value={option.value}>{t(option.key)}</option>))}</Input></FormGroup>
            </div>
            {filteredAndSortedObjetivos.length === 0 && !isLoading ? (<div className={styles.centeredStatus}><p className={styles.noGoalsMessage}>{!searchTerm && filterCategory === "all" ? t('myObjectives.noObjectives') : t('myObjectives.noResults')}</p></div>) : (<>
                {error && <p className={styles.errorMessageTop}>{t('common.updateErrorPrefix', { error: error })} <Button onClick={fetchObjetivos} size="small" variant="outline">{t('common.retry')}</Button></p>}
                <div className={`${styles.goalsGrid} ${showAllObjectives ? styles.expandedGrid : ''}`}>{objectivesToRender.map((objetivo) => (<ObjetivoCard key={objetivo.id_objetivo || objetivo.id} objective={objetivo} onObjectiveDeleted={handleObjectiveDeleted}/>))}</div>
                {filteredAndSortedObjetivos.length > initialDisplayLimit && !showAllObjectives && (<div className={styles.viewMoreContainer}><Button className={styles.toggleViewButton} onClick={() => setShowAllObjectives(true)} variant="outline">{t('myObjectives.viewMore', { count: filteredAndSortedObjetivos.length - initialDisplayLimit, total: filteredAndSortedObjetivos.length })}</Button></div>)}
                {showAllObjectives && filteredAndSortedObjetivos.length > initialDisplayLimit && (<div className={styles.viewMoreContainer}><Button className={styles.toggleViewButton} onClick={() => setShowAllObjectives(false)} variant="outline">{t('myObjectives.viewLess')}</Button></div>)}
            </>)}
        </div>
    );
}

export default MyObjectivesPage;