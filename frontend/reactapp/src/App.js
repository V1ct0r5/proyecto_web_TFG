// frontend/reactapp/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Importaciones de Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import DashboardPage from './pages/DashboardPage';
import CreateGoalPage from './pages/CreateGoalPage';
import MyObjectivesPage from './pages/MyObjectivesPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Importaciones de Layouts y Componentes UI
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar';
import FullPageLoader from './components/ui/FullPageLoader';

// El componente principal que contiene la lógica de enrutamiento y layout
function AppContent() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { isLoadingSettings } = useSettings();
    const location = useLocation();
    const { t } = useTranslation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (isAuthLoading || (isAuthenticated && isLoadingSettings)) {
        return <FullPageLoader message={t('loaders.initializing')} />;
    }

    if (isAuthenticated) {
        return (
            <div className="App">
                <Sidebar isSidebarOpen={isSidebarOpen} />
                <div className="main-layout-content">
                    <AppHeader onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
                    <main className="main-content-area">
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/mis-objetivos" element={<MyObjectivesPage />} />
                            <Route path="/objectives/new" element={<CreateGoalPage />} />
                            <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                            <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                            <Route path="/objectives/:id" element={<GoalDetailPage />} />
                            <Route path="/analisis" element={<AnalysisPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>
                </div>
                {isSidebarOpen && (
                    <button
                        className="sidebarOverlay"
                        onClick={() => setSidebarOpen(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    />
                )}
            </div>
        );
    }

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
                <Tooltip className="custom-tooltip" id="info-tooltip" />
            </SettingsProvider>
        </AuthProvider>
    );
}

export default App;