import React, { createContext, useContext, useState, useEffect, useMemo } from "react"; // Importar useMemo

// Crea el contexto de autenticación con un valor inicial nulo
const AuthContext = createContext(null);

// Proveedor de contexto de autenticación
export const AuthProvider = ({ children }) => {
    // Estados para el token JWT, los datos del usuario y el estado de carga inicial
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true inicialmente para indicar que se está cargando/verificando auth

    // Efecto que se ejecuta una vez al montar el componente para cargar datos de autenticación de localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            // Si hay token y usuario en localStorage
            setToken(storedToken);
            try {
                // Intenta parsear los datos del usuario
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Si falla el parseo (datos corruptos), limpia localStorage y reinicia el estado
                console.error("AuthContext: Error parsing user data from localStorage:", e);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setToken(null);
                setUser(null);
            }
        } else {
            // Si no hay token o usuario (o solo uno de ellos), asegura que ambos estén limpios
             localStorage.removeItem("token"); // Asegura limpieza completa si uno falta
             localStorage.removeItem("user");
             setToken(null);
             setUser(null);
        }
        // Una vez finalizada la verificación de localStorage, desactiva el estado de carga
        setLoading(false);
    }, []); // El array vacío [] asegura que este efecto solo se ejecute una vez al montar

    // Efecto que se ejecuta cuando el token cambia para mantener localStorage sincronizado
    useEffect(() => {
        if (token) {
            // Si hay un token, guárdalo en localStorage
            localStorage.setItem("token", token);
        } else {
            // Si el token es nulo (ej. logout), remueve el token de localStorage
            localStorage.removeItem("token");
        }
        // Nota: Los datos del usuario se guardan/remueven directamente en login/logout junto con el token.
    }, [token]); // Este efecto depende del estado 'token'

    // Función para manejar el inicio de sesión
    const login = (newToken, userData) => {
        setToken(newToken); // Actualiza el estado del token
        setUser(userData); // Actualiza el estado del usuario
        // Guarda el usuario en localStorage (como string JSON)
        localStorage.setItem("user", JSON.stringify(userData));
    };

    // Función para manejar el cierre de sesión
    const logout = () => {
        setToken(null); // Limpia el estado del token
        setUser(null); // Limpia el estado del usuario
        // Remueve el token y el usuario de localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    // Objeto de valor del contexto, calculado usando useMemo para optimizar
    // Se recalcula solo si 'token', 'user', o 'loading' cambian.
    const authValue = useMemo(() => ({
        token, // Token actual
        user, // Datos del usuario actual
        isAuthenticated: !!token, // Booleano: true si hay token, false en caso contrario
        loading, // Estado de carga inicial
        login, // Función para iniciar sesión
        logout, // Función para cerrar sesión
    }), [token, user, loading]); // Dependencias de useMemo

    // Proveer el contexto a los componentes hijos
    return (
        <AuthContext.Provider value={authValue}>
            {children} {/* Renderiza los componentes hijos */}
        </AuthContext.Provider>
    );
}

// Hook personalizado para consumir el contexto de autenticación
export const useAuth = () => {
    const context = useContext(AuthContext);
    // Verifica si el hook se está usando dentro del AuthProvider
    if (context === null) { // Cambiado de undefined a null para ser más preciso con el valor inicial del contexto
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};