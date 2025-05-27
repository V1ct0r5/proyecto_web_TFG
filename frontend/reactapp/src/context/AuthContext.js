import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
                // console.error("AuthContext: Error al parsear datos de usuario desde localStorage:", e); // Limpiado
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (isMounted) {
                    setToken(null);
                    setUser(null);
                }
            }
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (isMounted) {
                setToken(null);
                setUser(null);
            }
        }
        if (isMounted) {
            setLoading(false);
        }
        return () => { isMounted = false; }; // Cleanup para evitar memory leaks si el provider se desmonta
    }, []);

    useEffect(() => {
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
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }, []);

    const authValue = useMemo(() => ({
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
    }), [token, user, loading, login, logout]); // login y logout añadidas como dependencias (correctas)

    return (
        <AuthContext.Provider value={authValue}>
            {/* Solo renderizar hijos cuando la carga inicial haya terminado */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) { // Comparación precisa con el valor inicial del contexto
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};