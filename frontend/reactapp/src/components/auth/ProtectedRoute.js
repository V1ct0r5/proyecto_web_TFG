import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner"; // Asegúrate que la ruta a tu spinner es correcta

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation(); // Hook para obtener la ubicación actual

    // Muestra un indicador de carga mientras se verifica el estado de autenticación inicial.
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // Ajustar altura, asumiendo una variable CSS --app-header-height para la altura del header, o un valor fijo.
                height: 'calc(100vh - var(--app-header-height, 60px))' 
            }}>
                <LoadingSpinner size="large" /> {/* Usar un tamaño apropiado para la carga de página */}
            </div>
        );
    }

    // Si el usuario no está autenticado (y la carga ha terminado), redirige a la página de login.
    // Se pasa 'state={{ from: location }}' para que, tras un login exitoso,
    // se pueda redirigir al usuario de vuelta a la página que intentaba acceder.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si el usuario está autenticado, renderiza el contenido de la ruta anidada.
    return <Outlet />;
};

export default ProtectedRoute;