import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ObjetivosForm from "../components/objetivos/ObjetivosForm";
import api from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import styles from "./AuthLayout.module.css";
import buttonStyles from "../components/ui/Button.module.css";
import { toast } from 'react-toastify';
import { set } from "react-hook-form";

function ObjetivosPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);


    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const hasObjectives = objetivos.length > 0;
    // ¡CORRECCIÓN AQUÍ! Usar 'user.nombre_usuario'
    const userName = user ? user.nombre_usuario : 'Usuario';

    const handleObjectiveCreated = (nuevoObjetivo, errorMessage = null) => {
        if (nuevoObjetivo) {
            setObjetivos([nuevoObjetivo, ...objetivos]);
            toast.success('Objetivo creado con éxito.');
        } else if (errorMessage) {
            toast.error(errorMessage);
        }
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
            {user && (
                <header className={styles.pageHeader}>
                    <div className={styles.userInfo}>Hola, {userName}!</div>
                    <div className={styles.rightContent}>
                    <button onClick={handleLogout} className={buttonStyles.buttonSecondary || 'button-secondary'}>
                        Cerrar Sesión
                    </button>
                    </div>
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

            {loading && (
                 <div className="loading-overlay">
                    <p>Cargando...</p>  
                </div>
            )}

        </div>
    );
}

export default ObjetivosPage;