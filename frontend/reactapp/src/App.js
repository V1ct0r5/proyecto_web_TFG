// frontend/reactapp/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';

// Importaciones de Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import DashboardPage from './pages/DashboardPage';
// ... (el resto de las importaciones de páginas)
import CreateGoalPage from './pages/CreateGoalPage';
import MyObjectivesPage from './pages/MyObjectivesPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';


// Importaciones de Layouts y Componentes UI
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar';
import FullPageLoader from './components/ui/FullPageLoader';

// El componente principal que contiene la lógica de enrutamiento y layout
function AppContent() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { isLoadingSettings } = useSettings();
    const location = useLocation();
    const { t } = useTranslation();

    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    // Muestra un loader mientras se verifica el estado de autenticación o se cargan las configuraciones
    if (isAuthLoading || (isAuthenticated && isLoadingSettings)) {
        return <FullPageLoader message={t('loaders.initializing')} />;
    }

    // Si el usuario está autenticado, renderiza el layout principal con Sidebar y Header
    if (isAuthenticated) {
        return (
            <div className="App">
                <Sidebar />
                <div className="main-layout-content">
                    <AppHeader />
                    <main className="main-content-area">
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/objectives" element={<CreateGoalPage />} />
                            <Route path="/mis-objetivos" element={<MyObjectivesPage />} />
                            <Route path="/analisis" element={<AnalysisPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                            <Route path="/objectives/:id" element={<GoalDetailPage />} />
                            <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                            {/* Redirigir cualquier otra ruta al dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        );
    }

    // Si no está autenticado, renderiza solo las rutas públicas
    return (
        <div className="App">
            <main className="main-centered-auth">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </main>
        </div>
    );
}


// El componente raíz que envuelve todo con los proveedores de contexto
function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
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
                    theme="colored"
                />
            </SettingsProvider>
        </AuthProvider>
    );
}

export default App;