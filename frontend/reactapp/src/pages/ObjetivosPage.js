import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ObjetivosForm from "../components/objetivos/ObjetivosForm";
import api from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import styles from "./AuthLayout.module.css";
import buttonStyles from "../components/ui/Button.module.css";


function ObjetivosPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const hasObjectives = objetivos.length > 0;
    // ¡CORRECCIÓN AQUÍ! Usar 'user.nombre_usuario'
    const userName = user ? user.nombre_usuario : 'Usuario';

    const handleObjectiveCreated = (nuevoObjetivo, errorMessage = null) => {
        if (nuevoObjetivo) {
            setObjetivos([nuevoObjetivo, ...objetivos]);
            setSuccess('Objetivo creado con éxito.');
            setError(null);
        } else if (errorMessage) {
            setError(errorMessage);
            setSuccess(null);
        }
    };


    useEffect(() => {
        const fetchObjectives = async () => {
            try {
                const response = await api.getObjectives();
                setObjetivos(response.data);
            } catch (err) {
                console.error("Error al cargar los objetivos:", err.response ? err.response.data : err.message);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    logout();
                    navigate("/login");
                } else {
                    setError("Error al cargar tus objetivos. " + (err.response && err.response.data.message ? err.response.data.message : err.message));
                }
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem("token");
        if (!token) {
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
        } catch (err) {
            console.error("Error al cerrar sesión en el backend:", err);
        } finally {
            logout();
        }
    }

    if (loading && !objetivos.length) {
        return (
            <div className={styles.authPage}>
                <p>Cargando objetivos...</p>
            </div>
        );
    }

    if (error && !objetivos.length && !loading) {
        return (
            <div className={styles.authPage}>
                <p className={styles.formErrorGeneral || "error-message"}>{error}</p>
            </div>
        );
    }


    return (
        <div className={styles.authPage}>
            {user && (
                <header className={styles.pageHeader}>
                    <div className={styles.userInfo}>Hola, {userName}</div>
                    <button onClick={handleLogout} className={buttonStyles.buttonSecondary || 'button-secondary'}>
                        Cerrar Sesión
                    </button>
                </header>
            )}

            <div className={styles.mainContentArea}>
                <div className={styles.formContainer}>
                    <h2 className={styles.formTitle}>
                        {hasObjectives ? "Crea un nuevo objetivo" : "Crea tu primer objetivo"}
                    </h2>
                    <ObjetivosForm onObjectiveCreated={handleObjectiveCreated} />
                </div>
            </div>

        </div>
    );
}

export default ObjetivosPage;