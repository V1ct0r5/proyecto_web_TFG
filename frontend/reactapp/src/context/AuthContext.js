import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from 'react-toastify';
import api from '../services/apiService';
import { useTranslation } from "react-i18next";

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const inactivityTimerRef = useRef(null);

    const logout = useCallback(async (options = { notifyBackend: true }) => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        if (options.notifyBackend) {
            try {
                await api.logout();
            } catch (error) {
                console.warn("AuthContext: Falló la notificación de logout al backend (no crítico):", error.message);
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        if (token) {
            inactivityTimerRef.current = setTimeout(() => {
                toast.warn(t('toast.sessionExpired'), {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                window.dispatchEvent(new CustomEvent('logoutUser', { detail: { reason: 'inactivity', notifyBackend: true } }));
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [token, INACTIVITY_TIMEOUT_MS, t]);

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
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        if (isMounted) {
            setLoading(false);
        }
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    useEffect(() => {
        const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
        
        const activityDetected = () => {
            resetInactivityTimer();
        };

        if (token) {
            activityEvents.forEach(event => {
                window.addEventListener(event, activityDetected, { passive: true });
            });
            resetInactivityTimer();
        } else {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        }

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, activityDetected);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [token, resetInactivityTimer]);

    const login = useCallback((newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    }, []);

    const authValue = useMemo(() => ({
        token,
        user,
        isAuthenticated: !!token,
        isLoading: loading,
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
    const { t } = useTranslation();
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error(t('devErrors.useAuthMissingProvider'));
    }
    return context;
};