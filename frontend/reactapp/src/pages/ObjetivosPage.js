import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Hook de navegación
import ObjetivosForm from "../components/objetivos/ObjetivosForm"; // Componente del formulario de objetivos
import api from "../services/apiService"; // Servicio API
import { useAuth } from "../context/AuthContext"; // Contexto de autenticación
import styles from "../layouts/AuthLayout.module.css";
import { toast } from 'react-toastify'; // Notificaciones toast

function ObjetivosPage() {
    // Estado local para almacenar objetivos (Aunque esta página es principalmente para CREAR,
    // el useEffect carga todos los objetivos. Considerar si esto es necesario aquí).
    // Si esta página solo es para crear, este estado y el useEffect asociado podrían eliminarse.
    const [objetivos, setObjetivos] = useState([]);
    // Estado de carga para la obtención inicial de objetivos (si se mantiene el useEffect)
    const [loading, setLoading] = useState(true);

    // Hook de navegación
    const navigate = useNavigate();
    // Contexto de autenticación (user y logout)
    const { user, logout } = useAuth();

    // Determina si el usuario ya tiene objetivos. Basado en el estado 'objetivos' local.
    const hasObjectives = objetivos.length > 0;
    // Obtiene el nombre de usuario o usa un valor por defecto
    const userName = user ? user.nombre_usuario : 'Usuario'; // 'userName' se calcula pero no se usa en el render actual.

    // Manejador llamado cuando se crea/actualiza un objetivo en el formulario hijo
    const handleObjectiveCreated = (nuevoObjetivo, errorMessage = null) => {
        if (nuevoObjetivo) {
            // Si se creó un objetivo exitosamente:
            // setObjetivos([nuevoObjetivo, ...objetivos]); // Añadir al estado local (si se mantiene la lista)
            toast.success('Objetivo guardado con éxito.'); // Mensaje de éxito
            navigate('/dashboard'); // Redirige al dashboard
        } else if (errorMessage) {
            // Si hubo un error durante la creación (pasado por el formulario hijo):
            toast.error(errorMessage); // Muestra el mensaje de error
        }
    };


    // Efecto para cargar objetivos al montar el componente.
    useEffect(() => {
        const fetchObjectives = async () => {
            setLoading(true); // Activa carga
            try {
                // Intenta obtener objetivos
                const response = await api.getObjectives();
                setObjetivos(response.data); // Guarda objetivos
            } catch (err) {
                console.error("Error al cargar los objetivos:", err.response ? err.response.data : err.message);
                // Manejo de error de autenticación/autorización
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.warn("Error de autenticación al cargar objetivos en ObjetivosPage. Redirigiendo a login.");
                    logout(); // Cierra sesión en el frontend
                    navigate("/login"); // Redirige a login
                } else {
                    // Otro error, muestra toast
                    toast.error("Error al cargar tus objetivos. " + (err.response && err.response.data.message ? err.response.data.message : err.message));
                }
            } finally {
                setLoading(false); // Desactiva carga
            }
        };

        // Verifica si hay token antes de intentar obtener objetivos.
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found in ObjetivosPage. Redirecting to login.");
            logout(); // Asegura que el estado de auth esté limpio
            navigate("/login"); // Redirige
            setLoading(false); // Asegura que el loading se desactive
        } else {
             fetchObjectives(); // Si hay token, intenta cargar objetivos
        }


    }, [navigate, logout, api]); // Dependencias: navigate, logout, y api si cambia (aunque apiService suele ser estático)

    const handleLogout = async () => {
        setLoading(true); // Esto podría ser confuso, ya que loading es para la carga de objetivos
        try {
            await api.logout();
            toast.success('Sesión cerrada con éxito.');
        } catch (err) {
            console.error("Error al cerrar sesión en el backend:", err);
            toast.error('Error al cerrar sesión.');
        } finally {
            logout();
            setLoading(false); // Desactiva carga (de la acción de logout, no de objetivos)
        }
    }
    return (
        <div className={styles.authPage}>
            <div className={styles.mainContentArea}>
                    <h2 className={styles.formTitle}>
                        {hasObjectives ? "Crea un nuevo objetivo" : "Crea tu primer objetivo"}
                    </h2>
                    <ObjetivosForm onObjectiveCreated={handleObjectiveCreated} />
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