import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Componente de ruta protegida
// Verifica si el usuario está autenticado. Si no, redirige a la página de login.
// Si está autenticado, renderiza las rutas hijas (Outlet).
const ProtectedRoute = () => {
    // Obtiene el estado de autenticación y carga del contexto
    const { isAuthenticated, loading } = useAuth();

    // Si el estado de carga del contexto es verdadero, muestra un indicador de carga
    if (loading) {
        return <div>Cargando autenticación...</div>;
    }

    // Si el usuario no está autenticado, redirige a la página de login
    // 'replace' asegura que la página de login reemplace la entrada actual en el historial de navegación
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si el usuario está autenticado, renderiza las rutas hijas definidas en el router
    return <Outlet />;
};

export default ProtectedRoute;