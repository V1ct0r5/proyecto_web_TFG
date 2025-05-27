import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ObjetivosForm from "../components/objetivos/ObjetivosForm";
import api from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import styles from "./CreateGoalPage.module.css";
import { toast } from 'react-toastify';
import LoadingSpinner from "../components/ui/LoadingSpinner";

function CreateObjectivePage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const hasObjectives = objetivos.length > 0;

    const handleObjectiveSubmission = async (objectiveData) => {
        setIsSubmitting(true);
        try {
            await api.createObjective(objectiveData);
            toast.success('¡Nuevo objetivo creado con éxito!');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error desconocido al crear el objetivo.";
            toast.error(`Error al crear el objetivo: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelCreation = () => {
        navigate('/dashboard');
        toast.info("Creación de objetivo cancelada.");
    };

    const fetchInitialObjectives = useCallback(async () => {
        try {
            const data = await api.getObjectives();
            setObjetivos(Array.isArray(data) ? data : []);
        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                toast.error("Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión.");
                logout();
                navigate("/login", { replace: true, state: { from: location } });
            } else {
                toast.error(err.data?.message || err.message || "Error al cargar datos para esta página.");
            }
            setObjetivos([]); // Asegurar que objetivos es un array en caso de error.
        }
    }, [navigate, logout, location]);

    useEffect(() => {
        setLoading(true);
        fetchInitialObjectives().finally(() => {
            setLoading(false); // Asegurar que loading se desactiva después de la carga inicial
        });
    }, [fetchInitialObjectives]);

    if (loading) {
        return (
            <div className={styles.pageLoadingContainer}>
                <LoadingSpinner size="large" text="Preparando formulario..." />
            </div>
        );
    }

    return (
        <div className={styles.createGoalPageContainer}>
            <div className={styles.formWrapper}>
                <h2 className={styles.formTitle}>
                    {hasObjectives ? "Crea un Nuevo Objetivo" : "Crea Tu Primer Objetivo"}
                </h2>
                <ObjetivosForm
                    onSubmit={handleObjectiveSubmission}
                    isEditMode={false}
                    buttonText="Crear Objetivo"
                    onCancel={handleCancelCreation}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}

export default CreateObjectivePage;