import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/apiService";
import ObjetivoCard from "../components/objetivos/ObjetivoCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormGroup from "../components/ui/FormGroup";
import LoadingSpinner from "../components/ui/LoadingSpinner";

import styles from "./MyObjectivesPage.module.css"; // Usar 'styles' consistentemente

function MyObjectivesPage() {
    const [objetivos, setObjetivos] = useState([]); // <--- BUENA INICIALIZACIÓN
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [sortBy, setSortBy] = useState("recientes");

    const [showAllObjectives, setShowAllObjectives] = useState(false);
    const initialDisplayLimit = 6;

    const navigate = useNavigate();

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
        try {
            const data = await api.getObjectives(); // o api.obtenerTodosLosObjetivos si renombraste en apiService
            // Asegurar que 'data' es un array antes de actualizar el estado
            setObjetivos(Array.isArray(data) ? data : []); 
        } catch (err) {
            console.error("MyObjectivesPage: Error al cargar objetivos:", err);
            const errorMessage = err.message || "Error al cargar los objetivos. Intenta de nuevo más tarde.";
            setError(errorMessage);
            // toast.error(errorMessage); // El interceptor de apiService podría ya mostrar un toast
            setObjetivos([]); // <--- Asegurar que sea un array vacío en caso de error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchObjetivos();
    }, [fetchObjetivos]);

    const filteredAndSortedObjetivos = useMemo(() => {
        // 'objetivos' debería ser siempre un array debido a la inicialización y a fetchObjetivos
        if (!Array.isArray(objetivos)) {
            // Este console.warn es para depurar si algo inesperado ocurre y 'objetivos' no es un array
            console.warn("MyObjectivesPage: 'objetivos' en useMemo no es un array. Valor:", objetivos);
            return []; // Devolver un array vacío como fallback seguro
        }
        
        let result = [...objetivos]; // Trabajar con una copia

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
                result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case "antiguos":
                result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
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

    // 'objectivesToRender' siempre será un array si 'filteredAndSortedObjetivos' lo es.
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
                <LoadingSpinner />
                <p>Cargando tus objetivos...</p>
            </div>
        );
    }

    // Mostrar error si existe, incluso si no hay objetivos (prioridad al error)
    if (error && !objetivos.length) { // Modificado para mostrar error solo si no hay objetivos que mostrar
        return (
            <div className={styles.centeredStatus}>
                <p className={styles.errorMessage}>Error: {error}</p>
                <Button onClick={fetchObjetivos} variant="outline">Reintentar Carga</Button>
            </div>
        );
    }
    
    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.controlsAndCreateButton}>
                <div className={styles.controlsContainer}>
                    <FormGroup label="Buscar:" htmlFor="search-term" inline smallLabel>
                        <Input
                            type="text"
                            id="search-term"
                            placeholder="Nombre o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </FormGroup>
                    <FormGroup label="Categoría:" htmlFor="filter-category" inline smallLabel>
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
                    <FormGroup label="Ordenar por:" htmlFor="sort-by" inline smallLabel>
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
                <Button 
                    onClick={handleCreateObjective} 
                    className={styles.buttonCreateObjective}
                    variant="primary"
                >
                    Añadir Nuevo Objetivo
                </Button>
            </div>
            {filteredAndSortedObjetivos.length === 0 ? (
                <div className={styles.centeredStatus}>
                    <p className={styles.noGoalsMessage}>
                        {!searchTerm && filterCategory === "Todas"
                            ? "Aún no tienes objetivos creados. ¡Empieza añadiendo uno!"
                            : "No se encontraron objetivos que coincidan con tu búsqueda o filtros."}
                    </p>
                    {/* Mostrar error aquí si ocurrió pero hay datos viejos o se quiere mostrar siempre que haya error */}
                    {error && <p className={styles.errorMessageSecondary}>({error})</p>}
                </div>
            ) : (
                <>
                    {error && <p className={styles.errorMessageTop}>Hubo un error al actualizar: {error} <Button onClick={fetchObjetivos} size="small" variant="outline">Reintentar</Button></p>}
                    <div className={`${styles.goalsGrid} ${showAllObjectives ? styles.expandedGrid : ''}`}>
                        {objectivesToRender.map((objetivo) => ( // objectivesToRender también es un array
                            <ObjetivoCard
                                key={objetivo.id_objetivo || objetivo.id}
                                objective={objetivo}
                                // onObjectiveUpdate={fetchObjetivos} // Para refrescar si una card hace una acción
                            />
                        ))}
                    </div>

                    {hasMoreThanInitialLimit && !showAllObjectives && ( // Solo mostrar si no se muestran todos
                        <div className={styles.viewMoreContainer}>
                            <Button
                                className={styles.toggleViewButton}
                                onClick={() => setShowAllObjectives(true)} // Cambiado para mostrar todos
                                variant="outline"
                            >
                                {`Ver ${filteredAndSortedObjetivos.length - initialDisplayLimit} más (${filteredAndSortedObjetivos.length} en total)`}
                            </Button>
                        </div>
                    )}
                     {showAllObjectives && filteredAndSortedObjetivos.length > initialDisplayLimit && ( // Mostrar "ver menos" si se muestran todos y hay más del límite
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