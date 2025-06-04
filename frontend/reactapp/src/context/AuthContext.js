// frontend/reactapp/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from 'react-toastify';
import api from '../services/apiService'; // Asegúrate que la ruta a apiService es correcta

const AuthContext = createContext(null);

// Define el tiempo de inactividad en milisegundos
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // Ej: 15 minutos

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para la carga inicial del estado de autenticación

    const inactivityTimerRef = useRef(null);

    const logout = useCallback(async (options = { notifyBackend: true }) => {
        // console.log("AuthContext: logout iniciado. Notificar backend:", options.notifyBackend);
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        if (options.notifyBackend) {
            try {
                await api.logout(); // Notificar al backend
            } catch (error) {
                console.warn("AuthContext: Falló la notificación de logout al backend (no crítico):", error.message);
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []); // logout es estable, no tiene dependencias que cambien.

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        if (token) { // Usar el estado 'token'
            inactivityTimerRef.current = setTimeout(() => {
                toast.warn('Tu sesión ha expirado por inactividad. Serás desconectado.', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                // Despachar evento para que App.js maneje la UI del logout y llame a context.logout
                window.dispatchEvent(new CustomEvent('logoutUser', { detail: { reason: 'inactivity', notifyBackend: true } }));
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [token, INACTIVITY_TIMEOUT_MS]); // Depende de 'token' para saber si activar el timer

    // Efecto para la carga inicial desde localStorage
    useEffect(() => {
        let isMounted = true;
        const storedToken = localStorage.getItem("token");
        const storedUserString = localStorage.getItem("user");

        if (storedToken && storedUserString) {
            try {
                const parsedUser = JSON.parse(storedUserString);
                if (isMounted) {
                    setToken(storedToken);
                    setUser(parsedUser);
                }
            } catch (e) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (isMounted) {
                    setToken(null);
                    setUser(null);
                }
                console.error("AuthContext: Error parseando usuario desde localStorage", e);
            }
        } else {
            // Limpiar por si solo uno de los dos existe, para mantener consistencia
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        if (isMounted) {
            setLoading(false);
        }
        return () => { isMounted = false; };
    }, []);

    // Efecto para sincronizar el token con localStorage cuando cambie el estado 'token'
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    // Efecto para manejar los listeners de actividad y el temporizador de inactividad
    useEffect(() => {
        const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
        
        const activityDetected = () => {
            resetInactivityTimer();
        };

        if (token) { // Si el usuario está autenticado
            activityEvents.forEach(event => {
                window.addEventListener(event, activityDetected, { passive: true });
            });
            resetInactivityTimer(); // Iniciar/reiniciar el timer al autenticarse o si el token cambia
        } else { // Si el usuario no está autenticado (ej. después de logout)
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        }

        return () => { // Cleanup al desmontar el componente o antes de re-ejecutar el efecto
            activityEvents.forEach(event => {
                window.removeEventListener(event, activityDetected);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [token, resetInactivityTimer]); // Se ejecuta cuando 'token' o la función 'resetInactivityTimer' cambian

    const login = useCallback((newToken, userData) => {
        setToken(newToken); // Esto disparará los useEffects que dependen de 'token'
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        // setLoading(false); // Ya se maneja en el useEffect de carga inicial.
                           // No es necesario aquí a menos que login pueda ser llamado mientras isLoading es true.
    }, []);

    const authValue = useMemo(() => ({
        token,
        user,
        isAuthenticated: !!token,
        isLoading: loading,
        login,
        logout,
        // No es común exponer resetInactivityTimer, pero podría ser útil para un botón "Mantener sesión"
        // resetInactivityTimer 
    }), [token, user, loading, login, logout /*, resetInactivityTimer */]);

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