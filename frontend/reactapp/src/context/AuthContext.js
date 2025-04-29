import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/apiService";

// 1. Crear el contexto
const AuthContext = createContext(null);

// 2. Crear el proveedor del contexto
// El proveedor del contexto es un componente que envuelve a otros componentes y proporciona el contexto a ellos.
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [isAuthenticated, setIsAuthenticated] = useState(!!token); // Derivar el estado de autenticación del token


// Efecto para actualizar isAuthenticated cuando el token cambia
useEffect(() => {
    setIsAuthenticated(!!token);
    if (token) {
        localStorage.setItem("token", token);
    } else{
        localStorage.removeItem("token");
    }
}, [token]);

// Función para manejar el inicio de sesión
const login = (newToken) => {
    setToken(newToken);
};

// Función para manejar el cierre de sesión
const logout = () => {
    setToken(null);
};

// Valor que se propone a los componentes hijos
const authValue = {
    token,
    isAuthenticated,
    login,
    logout,
};

return (
    <AuthContext.Provider value={authValue}>
        {children}
    </AuthContext.Provider>
);
}

// 3. Crear un hook para usar el contexto
// Este hook permite a los componentes acceder al contexto sin necesidad de usar el Consumer directamente.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};
