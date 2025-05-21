import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Hook de navegación
import ObjetivosForm from "../components/objetivos/ObjetivosForm"; // Componente del formulario de objetivos
import api from "../services/apiService"; // Servicio API
import { useAuth } from "../context/AuthContext"; // Contexto de autenticación
import styles from "../layouts/AuthLayout.module.css";
import { toast } from 'react-toastify'; // Notificaciones toast

function ObjetivosPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Determina si el usuario ya tiene objetivos.
    const hasObjectives = objetivos.length > 0;

    const handleObjectiveCreated = (nuevoObjetivo, errorMessage = null) => {
        if (nuevoObjetivo) {
            toast.success('Objetivo guardado con éxito.');
            navigate('/dashboard'); // Redirige al dashboard
        } else if (errorMessage) {
            toast.error(errorMessage);
        }
    };

    // NUEVA FUNCIÓN: Manejador para el botón de cancelar en creación
    const handleCancelCreation = () => {
        navigate('/dashboard'); // Redirige al dashboard al cancelar
        toast.info("Creación de objetivo cancelada.");
    };

    useEffect(() => {
        const fetchObjectives = async () => {
            setLoading(true);
            try {
                const response = await api.getObjectives();
                setObjetivos(response.data);
            } catch (err) {
                console.error("Error al cargar los objetivos:", err.response ? err.response.data : err.message);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.warn("Error de autenticación al cargar objetivos en ObjetivosPage. Redirigiendo a login.");
                    logout();
                    navigate("/login");
                } else {
                    toast.error("Error al cargar tus objetivos. " + (err.response && err.response.data.message ? err.response.data.message : err.message));
                }
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found in ObjetivosPage. Redirecting to login.");
            logout();
            navigate("/login");
            setLoading(false);
        } else {
            fetchObjectives();
        }
    }, [navigate, logout]);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await api.logout();
            toast.success('Sesión cerrada con éxito.');
        } catch (err) {
            console.error("Error al cerrar sesión en el backend:", err);
            toast.error('Error al cerrar sesión.');
        } finally {
            logout();
            setLoading(false);
        }
    }
    return (
        <div className={styles.authPage}>
            <div className={styles.mainContentArea}>
                <h2 className={styles.formTitle}>
                    {hasObjectives ? "Crea un nuevo objetivo" : "Crea tu primer objetivo"}
                </h2>
                <ObjetivosForm
                    onObjectiveCreated={handleObjectiveCreated}
                    isFirstObjective={!hasObjectives}
                    onCancel={handleCancelCreation}
                />
            </div>
            {loading && (
                <div className="loading-overlay">
                    <p>Cargando...</p>
                </div>
            )}
        </div>
    );
}

export default ObjetivosPage;