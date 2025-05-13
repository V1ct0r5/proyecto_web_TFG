import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Crear el contexto
const AuthContext = createContext(null);

// 2. Crear el proveedor del contexto
// El proveedor del contexto es un componente que envuelve a otros componentes y proporciona el contexto a ellos.
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));


// Efecto para actualizar isAuthenticated cuando el token cambia
useEffect(() => {
    console.log("[AuthContext] Token changed:", token ? "Exists" : "Null");
    if (token) {
        localStorage.setItem("token", token);
    } else{
        localStorage.removeItem("token");
    }
}, [token]);

// Función para manejar el inicio de sesión
const login = (newToken) => {
    console.log("[AuthContext] Calling login with new token");
    setToken(newToken);
};

// Función para manejar el cierre de sesión
const logout = () => {
    console.log("[AuthContext] Calling logout");
    setToken(null);
};

// Valor que se propone a los componentes hijos
const authValue = {
    token,
    isAuthenticated: !!token, // true si hay un token, false si no
    login,
    logout,
};

console.log("[AuthProvider] Rendering with isAuthenticated:", authValue.isAuthenticated);


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
