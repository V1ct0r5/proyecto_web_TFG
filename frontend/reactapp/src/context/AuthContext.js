// frontend/reactapp/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Se mantiene true hasta que se verifique el token inicial

    useEffect(() => {
        let isMounted = true;
        const storedToken = localStorage.getItem("token");
        const storedUserString = localStorage.getItem("user");
        let parsedUser = null;

        if (storedToken && storedUserString) {
            try {
                parsedUser = JSON.parse(storedUserString);
                if (isMounted) {
                    setToken(storedToken);
                    setUser(parsedUser);
                }
            } catch (e) {
                // En caso de error al parsear, limpiar localStorage para evitar estados corruptos
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (isMounted) {
                    setToken(null);
                    setUser(null);
                }
            }
        } else {
            // Asegurar que no haya datos parciales en localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (isMounted) {
                setToken(null);
                setUser(null);
            }
        }
        if (isMounted) {
            setLoading(false); // Finaliza la carga inicial después de verificar localStorage
        }
        return () => { isMounted = false; }; // Cleanup para evitar actualizaciones en un componente desmontado
    }, []);

    useEffect(() => {
        // Sincronizar el token con localStorage cuando cambie
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    const login = useCallback((newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false); // Asegurar que el estado de carga sea falso después del login
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false); // Asegurar que el estado de carga sea falso después del logout
    }, []);

    // Memoizar el valor del contexto para optimizar rendimiento
    const authValue = useMemo(() => ({
        token,
        user,
        isAuthenticated: !!token,
        isLoading: loading, // Exponer 'loading' como 'isLoading' para mayor claridad
        login,
        logout,
    }), [token, user, loading, login, logout]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};