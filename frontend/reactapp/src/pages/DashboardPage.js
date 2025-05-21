import React, { useEffect, useState, useMemo } from "react";
import api from "../services/apiService";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ObjetivoCard from "../components/objetivos/ObjetivoCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormGroup from "../components/ui/FormGroup";
import { useNavigate } from "react-router-dom";
import dashboardStyles from "./DashboardPage.module.css";
import buttonStyles from "../components/ui/Button.module.css";

function DashboardPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [sortBy, setSortBy] = useState("recientes");

    const { token, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const tipoObjetivoOptions = [
        "Todas",
        "Salud",
        "Finanzas",
        "Desarrollo personal",
        "Relaciones",
        "Carrera profesional",
        "Otros",
    ];

    useEffect(() => {
        if (!authLoading && isAuthenticated && token) {
            const fetchObjectives = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await api.getObjectives();
                    setObjetivos(response.data);
                } catch (err) {
                    const errorMessage =
                        "Error al cargar tus objetivos. " +
                        (err.response?.data?.message || err.message || err.toString());
                    setError(errorMessage);
                    toast.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            fetchObjectives();
        } else {
            if (authLoading) {
                setLoading(true);
            } else {
                setLoading(false);
            }
        }
    }, [token, isAuthenticated, authLoading]);

    const filteredAndSortedObjetivos = useMemo(() => {
        let currentObjetivos = [...objetivos];

        if (searchTerm) {
            currentObjetivos = currentObjetivos.filter(
                (obj) =>
                    obj.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    obj.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterCategory !== "Todas") {
            currentObjetivos = currentObjetivos.filter(
                (obj) => obj.tipo_objetivo === filterCategory
            );
        }

        currentObjetivos.sort((a, b) => {
            switch (sortBy) {
                case "recientes":
                    const dateA = new Date(a.fecha_creacion || a.fecha_inicio);
                    const dateB = new Date(b.fecha_creacion || b.fecha_inicio);
                    return dateB.getTime() - dateA.getTime();
                case "progreso":
                    // --- INICIO DE CAMBIO IMPORTANTE ---
                    // Calcular progreso de forma segura para a
                    const aCurrent = parseFloat(a.valor_actual);
                    const aTarget = parseFloat(a.valor_cuantitativo);
                    let progresoA = 0;
                    if (!isNaN(aCurrent) && !isNaN(aTarget) && aTarget > 0) {
                        progresoA = (a.es_menor_mejor ? (aTarget / aCurrent) : (aCurrent / aTarget)) * 100;
                        progresoA = Math.min(progresoA, 100);
                    } else if (a.estado === 'Completado') {
                         progresoA = 100; // Si está completado y no tiene valores cuantitativos, asume 100%
                    }

                    // Calcular progreso de forma segura para b
                    const bCurrent = parseFloat(b.valor_actual);
                    const bTarget = parseFloat(b.valor_cuantitativo);
                    let progresoB = 0;
                    if (!isNaN(bCurrent) && !isNaN(bTarget) && bTarget > 0) {
                        progresoB = (b.es_menor_mejor ? (bTarget / bCurrent) : (bCurrent / bTarget)) * 100;
                        progresoB = Math.min(progresoB, 100);
                    } else if (b.estado === 'Completado') {
                        progresoB = 100; // Si está completado y no tiene valores cuantitativos, asume 100%
                    }

                    return progresoB - progresoA; // Mayor progreso primero
                // --- FIN DE CAMBIO IMPORTANTE ---
                case "alfabetico":
                    return a.nombre.localeCompare(b.nombre);
                default:
                    return 0;
            }
        });

        return currentObjetivos;
    }, [objetivos, searchTerm, filterCategory, sortBy]);

    const handleNavigateToCreateObjective = () => {
        navigate("/objectives");
    };

    if (loading || authLoading) {
        return (
            <div className={dashboardStyles.dashboardContainer}>
                <div className={dashboardStyles.loadingState}>Cargando...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={dashboardStyles.dashboardContainer}>
                <div className={dashboardStyles.errorState}>{error}</div>
            </div>
        );
    }

    return (
        <div className={dashboardStyles.dashboardContainer}>
            <h1 className={dashboardStyles.pageTitle}>Mi Dashboard</h1>

            <div className={dashboardStyles.controlsContainer}>
                <FormGroup label="Buscar Objetivo" htmlFor="searchTerm">
                    <Input
                        type="text"
                        id="searchTerm"
                        placeholder="Buscar por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Filtrar por Categoría" htmlFor="filterCategory">
                    <Input
                        type="select"
                        id="filterCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {tipoObjetivoOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </Input>
                </FormGroup>

                <FormGroup label="Ordenar por" htmlFor="sortBy">
                    <Input
                        type="select"
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recientes">Más Recientes</option>
                        <option value="progreso">Progreso</option>
                        <option value="alfabetico">Alfabético (Nombre)</option>
                    </Input>
                </FormGroup>
            </div>

            <div className={dashboardStyles.sectionHeader}>
                <h2 className={dashboardStyles.sectionTitle}>Tus Objetivos</h2>
                <Button
                    className={buttonStyles.buttonCreateObjective}
                    onClick={handleNavigateToCreateObjective}
                >
                    + Añadir Nuevo Objetivo
                </Button>
            </div>

            {filteredAndSortedObjetivos.length === 0 ? (
                <p className={dashboardStyles.noGoalsMessage}>
                    {!searchTerm && filterCategory === "Todas"
                        ? "Aún no tienes objetivos creados. Haz clic en 'Añadir Nuevo Objetivo' para crear el primero."
                        : "No se encontraron objetivos que coincidan con tus filtros."}
                </p>
            ) : (
                <div className={dashboardStyles.goalsGrid}>
                    {filteredAndSortedObjetivos.map((objetivo) => (
                        <ObjetivoCard
                            key={objetivo.id_objetivo || objetivo.id}
                            objective={objetivo} // Asegúrate de que el prop se llama 'objective'
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardPage;