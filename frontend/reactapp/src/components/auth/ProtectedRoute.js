import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ProtectedRoute es un componente que protege las rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // Si el usuario no está autenticado, redirigir a la página de inicio de sesión
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si el usuario está autenticado, renderizar el componente hijo
    return children;
};

export default ProtectedRoute;