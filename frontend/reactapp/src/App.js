// frontend/reactapp/src/App.js
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import CreateGoalPage from './pages/CreateGoalPage';
import MyObjectivesPage from './pages/MyObjectivesPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';
import NewDashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar';
import FullPageLoader from './components/ui/FullPageLoader';

import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';

function AppContent() {
    const { isAuthenticated, isLoading: isAuthLoading, logout: contextLogout } = useAuth();
    const { isLoadingSettings, isApplyingTheme } = useSettings();
    const location = useLocation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const isLoggingOutRef = useRef(isLoggingOut);

    useEffect(() => {
        isLoggingOutRef.current = isLoggingOut;
    }, [isLoggingOut]);

    useEffect(() => {
        const handleLogoutEvent = (event) => {
            if (!isAuthenticated || isLoggingOutRef.current) {
                return;
            }
            setIsLoggingOut(true);
            const notifyBackend = event.detail?.notifyBackend !== undefined ? event.detail.notifyBackend : true;
            contextLogout({ notifyBackend })
                .catch(err => {
                    console.error("AppContent: Error durante contextLogout:", err);
                });
        };
        window.addEventListener('logoutUser', handleLogoutEvent);
        return () => {
            window.removeEventListener('logoutUser', handleLogoutEvent);
        };
    }, [contextLogout, isAuthenticated]);

    useEffect(() => {
        if (location.pathname === '/login' && !isAuthenticated && !isAuthLoading) {
            if (isLoggingOut) {
                setIsLoggingOut(false);
            }
        }
    }, [location.pathname, isAuthenticated, isAuthLoading, isLoggingOut]);

    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    if ((isAuthLoading || (isAuthenticated && isLoadingSettings) || isApplyingTheme) && !isAuthRoute) {
        const message = isAuthLoading ? "Inicializando aplicación..." 
                      : (isLoadingSettings ? "Cargando configuración..." 
                      : "Aplicando tema...");
        return <FullPageLoader message={message} />;
    }

    return (
        <div className="App">
            {isLoggingOut && location.pathname !== '/login' && (
                <FullPageLoader message="Tu sesión ha finalizado. Redirigiendo al login..." />
            )}

            {isAuthenticated && !isAuthRoute && <Sidebar />}

            <div className={`main-layout-content ${isAuthenticated && !isAuthRoute ? "with-sidebar" : ""}`}>
                {isAuthenticated && !isAuthRoute && <AppHeader />}
                <main className={isAuthenticated && !isAuthRoute ? "main-content-area" : "main-content-centered"}>
                    <Routes>
                        <Route
                            path="/"
                            element={isAuthLoading ? <FullPageLoader message="Cargando..." /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)}
                        />
                        <Route element={isAuthLoading ? <FullPageLoader message="Verificando sesión..." /> : <AuthLayout />}>
                            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<NewDashboardPage />} />
                            <Route path="/objectives" element={<CreateGoalPage />} />
                            <Route path="/mis-objetivos" element={<MyObjectivesPage />} />
                            <Route path="/analisis" element={<AnalysisPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                            <Route path="/objectives/:id" element={<GoalDetailPage />} />
                            <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                        </Route>
                        <Route
                            path="*"
                            element={isAuthLoading ? <FullPageLoader message="Cargando..." /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)}
                        />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </SettingsProvider>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </AuthProvider>
    );
}

export default App;