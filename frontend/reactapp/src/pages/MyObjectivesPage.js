import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/apiService";
import ObjetivoCard from "../components/objetivos/ObjetivoCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormGroup from "../components/ui/FormGroup";
import LoadingSpinner from "../components/ui/LoadingSpinner";

import styles from "./MyObjectivesPage.module.css";

function MyObjectivesPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [sortBy, setSortBy] = useState("recientes");

    const [showAllObjectives, setShowAllObjectives] = useState(false);
    const initialDisplayLimit = 6;

    const navigate = useNavigate();
    const processedNoObjectivesRef = useRef(false);

    const tipoObjetivoOptions = useMemo(() => [
        "Todas", "Salud", "Finanzas", "Desarrollo personal",
        "Relaciones", "Carrera profesional", "Otros"
    ], []);

    const sortByOptions = useMemo(() => [
        { value: "recientes", label: "Más Recientes" },
        { value: "antiguos", label: "Más Antiguos" },
        { value: "nombreAsc", label: "Nombre (A-Z)" },
        { value: "nombreDesc", label: "Nombre (Z-A)" },
        { value: "progresoAsc", label: "Progreso (Menor a Mayor)" },
        { value: "progresoDesc", label: "Progreso (Mayor a Menor)" },
        { value: "fechaFinAsc", label: "Fecha Fin (Próximos)" },
    ], []);

    const fetchObjetivos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        let redirected = false;
        try {
            const data = await api.getObjectives();

            if (Array.isArray(data)) {
                setObjetivos(data);
                if (data.length === 0) {
                    if (!processedNoObjectivesRef.current) {
                        processedNoObjectivesRef.current = true;
                        toast.info("Aún no tienes objetivos. ¡Vamos a crear el primero!", { autoClose: 4000 });
                        navigate('/objectives', { replace: true });
                        redirected = true;
                        return;
                    } else {
                        if (window.location.pathname === '/mis-objetivos') {
                            navigate('/objectives', { replace: true, state: { message: "Crea tu primer objetivo." } });
                        }
                        redirected = true;
                        return;
                    }
                } else {
                    processedNoObjectivesRef.current = false;
                }
            } else {
                setObjetivos([]);
                processedNoObjectivesRef.current = false;
            }
        } catch (err) {
            const errorMessage = err.message || "Error al cargar los objetivos. Intenta de nuevo más tarde.";
            setError(errorMessage);
            setObjetivos([]);
            processedNoObjectivesRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchObjetivos();
    }, [fetchObjetivos]);

    const handleObjectiveDeleted = useCallback(() => {
        processedNoObjectivesRef.current = false;
        fetchObjetivos();
    }, [fetchObjetivos]);

    const filteredAndSortedObjetivos = useMemo(() => {
        if (!Array.isArray(objetivos)) {
            return [];
        }
        let result = [...objetivos];
        if (filterCategory !== "Todas") {
            result = result.filter(obj => obj.tipo_objetivo === filterCategory);
        }
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(obj =>
                obj.nombre.toLowerCase().includes(lowerSearchTerm) ||
                (obj.descripcion && obj.descripcion.toLowerCase().includes(lowerSearchTerm))
            );
        }
        switch (sortBy) {
            case "recientes":
                result.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
                break;
            case "antiguos":
                result.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0));
                break;
            case "nombreAsc":
                result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
                break;
            case "nombreDesc":
                result.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
                break;
            case "progresoAsc":
                result.sort((a, b) => (a.progreso_calculado ?? 0) - (b.progreso_calculado ?? 0));
                break;
            case "progresoDesc":
                result.sort((a, b) => (b.progreso_calculado ?? 0) - (a.progreso_calculado ?? 0));
                break;
            case "fechaFinAsc":
                result.sort((a, b) => {
                    const dateA = a.fecha_fin ? new Date(a.fecha_fin) : new Date('9999-12-31');
                    const dateB = b.fecha_fin ? new Date(b.fecha_fin) : new Date('9999-12-31');
                    return dateA - dateB;
                });
                break;
            default:
                break;
        }
        return result;
    }, [objetivos, searchTerm, filterCategory, sortBy]);

    const objectivesToRender = showAllObjectives
        ? filteredAndSortedObjetivos
        : filteredAndSortedObjetivos.slice(0, initialDisplayLimit);

    const hasMoreThanInitialLimit = filteredAndSortedObjetivos.length > initialDisplayLimit;

    const handleCreateObjective = () => {
        navigate('/objectives');
    };

    if (isLoading) {
        return (
            <div className={styles.centeredStatus}>
                <LoadingSpinner size="large" text="Cargando tus objetivos..." />
            </div>
        );
    }

    if (error && filteredAndSortedObjetivos.length === 0) {
        return (
            <div className={styles.centeredStatus}>
                <p className={styles.errorMessage}>Error: {error}</p>
                <Button onClick={fetchObjetivos} variant="outline">Reintentar Carga</Button>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.pageHeader}>
                <Button
                    onClick={handleCreateObjective}
                    className={styles.createButtonTopRight}
                    variant="primary"
                >
                    Añadir Nuevo Objetivo
                </Button>
            </div>

            <div className={styles.topControlBar}>
                <FormGroup label="Buscar:" htmlFor="search-term" inline smallLabel className={styles.searchFormGroup}>
                    <Input
                        type="text"
                        id="search-term"
                        placeholder="Nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </FormGroup>
                <FormGroup label="Categoría:" htmlFor="filter-category" inline smallLabel className={styles.filterFormGroup}>
                    <Input
                        type="select"
                        id="filter-category"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={styles.filterSelect}
                    >
                        {tipoObjetivoOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Input>
                </FormGroup>
                <FormGroup label="Ordenar por:" htmlFor="sort-by" inline smallLabel className={styles.sortFormGroup}>
                    <Input
                        type="select"
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.sortSelect}
                    >
                        {sortByOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </Input>
                </FormGroup>
            </div>
            {filteredAndSortedObjetivos.length === 0 && !isLoading ? (
                <div className={styles.centeredStatus}>
                    <p className={styles.noGoalsMessage}>
                        {!searchTerm && filterCategory === "Todas" && !error
                            ? "Aún no tienes objetivos creados. ¡Empieza añadiendo uno!"
                            : "No se encontraron objetivos que coincidan con tu búsqueda o filtros."}
                    </p>
                    {error && <p className={styles.errorMessageSecondary}>({error})</p>}
                </div>
            ) : (
                <>
                    {error && <p className={styles.errorMessageTop}>Hubo un error al actualizar: {error} <Button onClick={fetchObjetivos} size="small" variant="outline">Reintentar</Button></p>}
                    <div className={`${styles.goalsGrid} ${showAllObjectives ? styles.expandedGrid : ''}`}>
                        {objectivesToRender.map((objetivo) => (
                            <ObjetivoCard
                                key={objetivo.id_objetivo || objetivo.id}
                                objective={objetivo}
                                onObjectiveDeleted={handleObjectiveDeleted}
                            />
                        ))}
                    </div>

                    {hasMoreThanInitialLimit && !showAllObjectives && (
                        <div className={styles.viewMoreContainer}>
                            <Button
                                className={styles.toggleViewButton}
                                onClick={() => setShowAllObjectives(true)}
                                variant="outline"
                            >
                                {`Ver ${filteredAndSortedObjetivos.length - initialDisplayLimit} más (${filteredAndSortedObjetivos.length} en total)`}
                            </Button>
                        </div>
                    )}
                     {showAllObjectives && filteredAndSortedObjetivos.length > initialDisplayLimit && (
                        <div className={styles.viewMoreContainer}>
                            <Button
                                className={styles.toggleViewButton}
                                onClick={() => setShowAllObjectives(false)}
                                variant="outline"
                            >
                                Ver menos objetivos
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MyObjectivesPage;