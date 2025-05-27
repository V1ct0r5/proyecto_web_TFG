import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './AppHeader.module.css';
import buttonStyles from '../components/ui/Button.module.css';

const getHeaderTitle = (pathname) => {
    switch (pathname) {
        case '/dashboard':
            return 'Panel de Control';
        case '/objectives': // Asumiendo que esta es la ruta para la página de creación
            return 'Crear Nuevo Objetivo';
        case '/mis-objetivos':
            return 'Mis Objetivos';
        case '/analisis':
            return 'Análisis de Progreso';
        case '/perfil':
            return 'Mi Perfil';
        case '/configuracion':
            return 'Configuración';
        default:
            if (pathname.match(/^\/objectives\/view\/(\d+)$/)) return 'Detalles del Objetivo';
            if (pathname.match(/^\/objectives\/(\d+)$/)) return 'Detalles del Objetivo';
            if (pathname.match(/^\/objectives\/edit\/(\d+)$/)) return 'Editar Objetivo';
            if (pathname.match(/^\/objectives\/(\d+)\/update-progress$/)) return 'Actualizar Progreso';
            return 'GoalMaster'; // Título por defecto o fallback
    }
};

function AppHeader() {
    const { user, isAuthenticated, logout: contextLogout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const pageTitle = getHeaderTitle(location.pathname);

    const handleLogout = async () => {
        try {
            await api.logout();
            toast.success('Sesión cerrada con éxito.');
        } catch (err) {
            // Los errores 401/403 deberían ser manejados por el interceptor de apiService.
            // Este toast es para otros posibles errores de red/servidor durante el logout.
            if (!(err.response && (err.response.status === 401 || err.response.status === 403))) {
                toast.error('Error al comunicar con el servidor para cerrar sesión. Se cerrará la sesión localmente.');
            }
        } finally {
            contextLogout(); // Limpia el estado del contexto y el localStorage.
            navigate("/login", { replace: true });
        }
    };

    if (!isAuthenticated) {
        // No renderizar el header si el usuario no está autenticado.
        // Esta lógica podría también estar centralizada en un componente de rutas protegidas.
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.leftContent}>
                {/* Muestra el título de la página o un placeholder/logo por defecto */}
                {pageTitle ? (
                    <h1 className={styles.headerPageTitle}>{pageTitle}</h1>
                ) : (
                    <div className={styles.headerPlaceholder}></div> // Considerar mostrar el logo aquí como fallback
                )}
            </div>

            {user && (
                <div className={styles.rightContent}>
                    <span className={styles.userInfo}>
                        ¡Hola, {user.nombre_usuario || 'Usuario'}!
                    </span>
                    <button
                        onClick={handleLogout}
                        className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
                        aria-label="Cerrar sesión"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </header>
    );
}

export default AppHeader;