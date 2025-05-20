import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Hook para acceder al contexto de autenticación
import api from '../services/apiService'; // Servicio para llamadas a la API
import { toast } from 'react-toastify'; // Para notificaciones toast
import styles from './AppHeader.module.css'; // Estilos específicos del layout
import buttonStyles from '../components/ui/Button.module.css'; // Estilos para el botón (aunque se podría usar el componente Button)

// Layout del encabezado de la aplicación
function AppHeader() {
    // Obtiene el usuario, estado de autenticación y función de logout del contexto
    const { user, isAuthenticated, logout } = useAuth();
    // Hook de navegación
    const navigate = useNavigate();

    // Manejador para el evento de cerrar sesión
    const handleLogout = async () => {
        try {
            // Intenta llamar al endpoint de logout del backend
            await api.logout();
            toast.success('Sesión cerrada con éxito.'); // Muestra mensaje de éxito al usuario
        } catch (err) {
            // Manejo de errores en el logout del backend (aunque el principal lo hace el frontend)
            console.error("Error al cerrar sesión en el backend:", err);
            // Si el error es 401 o 403, el interceptor ya debería redirigir.
            // Para otros errores, mostramos un toast.
            if (!(err.response && (err.response.status === 401 || err.response.status === 403))) {
                toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
            }
        } finally {
            // Llama a la función logout del contexto, que limpia el estado y localStorage
            // Esto se ejecuta siempre, independientemente del resultado de la llamada al backend,
            // asegurando que el usuario se desloguee en el frontend.
            logout();
            // Redirige a la página de login después de cerrar sesión
            navigate("/login");
        }
    };

    // Renderiza el encabezado
    return (
        <header className={styles.header}>
            <div className={styles.leftContent}>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className={styles.headerLogoLink}>
                    <div className={styles.headerLogoCircle}>
                        <span>G</span>
                    </div>
                    <span className={styles.headerBrand}>GoalMaster</span> {/* Nombre de la marca */}
                </Link>
            </div>
            {isAuthenticated && user && (
                <div className={styles.rightContent}>
                    <span className={styles.userInfo}>Hola, {user.nombre_usuario || 'Usuario'}!</span>
                    <button onClick={handleLogout} className={buttonStyles.buttonSecondary}>
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </header>
    );
}

export default AppHeader;