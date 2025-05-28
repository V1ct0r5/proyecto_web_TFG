// frontend/reactapp/src/components/auth/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Asegúrate que la ruta es correcta
import LoadingSpinner from "../ui/LoadingSpinner"; 

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth(); // Se usa 'isLoading' del AuthContext
    const location = useLocation(); // Hook para obtener la ubicación actual

    // Muestra un indicador de carga mientras se verifica el estado de autenticación inicial
    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // Altura calculada para ocupar el espacio disponible menos la altura del header (si existe)
                height: 'calc(100vh - var(--app-header-height, 60px))' 
            }}>
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // Si el usuario no está autenticado (y la carga ha terminado), redirige a la página de login
    if (!isAuthenticated) {
        // Se pasa 'state={{ from: location }}' para que, tras un login exitoso,
        // se pueda redirigir al usuario de vuelta a la página que intentaba acceder.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si el usuario está autenticado, renderiza el contenido de la ruta anidada (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;