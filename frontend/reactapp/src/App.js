// frontend/reactapp/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import CreateGoalPage from './pages/CreateGoalPage';
import MyObjectivesPage from './pages/MyObjectivesPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';
import NewDashboardPage from './pages/DashboardPage';

// Componentes/Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar';
import FullPageLoader from './components/ui/FullPageLoader';

// Estilos y Contexto
import './styles/index.css'; // Asumiendo que moviste los estilos de App.css a index.css
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';
import { AuthProvider, useAuth } from './context/AuthContext';


function AppContent() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const location = useLocation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const handleLogoutEvent = () => {
            if (!isLoggingOut && isAuthenticated) {
                setIsLoggingOut(true);
                logout();
            }
        };
        window.addEventListener('logoutUser', handleLogoutEvent);
        return () => {
            window.removeEventListener('logoutUser', handleLogoutEvent);
        };
    }, [logout, isAuthenticated, isLoggingOut]);

    useEffect(() => {
        if (isLoggingOut && location.pathname === '/login' && !isAuthenticated && !isLoading) {
            setIsLoggingOut(false);
        }
    }, [location.pathname, isLoggingOut, isAuthenticated, isLoading]);

    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    // Loader para la carga inicial de AuthContext
    if (isLoading && !isAuthenticated && !isAuthRoute) {
        return <FullPageLoader message="Inicializando..." />;
    }
    
    return (
        <div className="App">
            {/* Loader para "Sesión Expirada" como overlay */}
            {isLoggingOut && location.pathname !== '/login' && (
                <FullPageLoader message="Tu sesión ha expirado. Redirigiendo al login..." />
            )}

            {isAuthenticated && !isAuthRoute && <Sidebar />}
            
            <div className={`main-layout-content ${isAuthenticated && !isAuthRoute ? "with-sidebar" : ""}`}>
                {isAuthenticated && !isAuthRoute && <AppHeader />}
                
                <main className={isAuthenticated && !isAuthRoute ? "main-content-area" : "main-content-centered"}>
                    <Routes>
                        <Route 
                            path="/" 
                            element={isLoading ? <FullPageLoader message="Cargando..." /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)} 
                        />
                        
                        <Route element={isLoading ? <FullPageLoader message="Cargando..." /> : <AuthLayout />}>
                            <Route 
                                path="/login" 
                                element={isLoading ? <FullPageLoader /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />) }
                            />
                            <Route 
                                path="/register" 
                                element={isLoading ? <FullPageLoader /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />)} 
                            />
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<NewDashboardPage />} />
                            <Route path="/objectives" element={<CreateGoalPage />} />
                            <Route path="/mis-objetivos" element={<MyObjectivesPage />} />
                            <Route path="/analisis" element={<div>Página de Análisis (Placeholder)</div>} />
                            <Route path="/perfil" element={<div>Página de Mi Perfil (Placeholder)</div>} />
                            <Route path="/configuracion" element={<div>Página de Configuración (Placeholder)</div>} />
                            <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                            <Route path="/objectives/:id" element={<GoalDetailPage />} />
                            <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                        </Route>
                        
                        <Route 
                            path="*" 
                            element={isLoading ? <FullPageLoader message="Cargando..." /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)} 
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
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
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
            />
        </AuthProvider>
    );
}

export default App;