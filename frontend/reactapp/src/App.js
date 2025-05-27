import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import CreateGoalPage from './pages/CreateGoalPage';
import MyObjectivesPage from './pages/MyObjectivesPage'; // Asumiendo que este es el componente para '/mis-objetivos'
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';
import NewDashboardPage from './pages/DashboardPage'; // Renombrado para claridad o si hubo un DashboardPage previo

// Componentes/Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout'; // Layout para páginas de autenticación
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar';

// Estilos y Contexto
import './index.css';
import './styles/App.css'; // Archivo CSS principal consolidado
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css'; // Estilos para el DatePicker
import { AuthProvider, useAuth } from './context/AuthContext';

// El componente PageTitle se asume ahora integrado y manejado por AppHeader.js
// por lo que se elimina su definición y renderizado explícito desde App.js

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent /> {/* Componente para manejar la lógica de layout dependiente de la autenticación */}
            </BrowserRouter>
            <ToastContainer
                position="bottom-right"
                autoClose={3000} // Tiempo ligeramente aumentado para mejor visibilidad
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

// Componente auxiliar para estructurar el contenido principal de la aplicación.
// Permite el uso de hooks como useAuth y useLocation dentro del contexto de BrowserRouter.
function AppContent() {
    const { isAuthenticated, loading } = useAuth(); // Obtiene estado de autenticación y carga
    const location = useLocation(); // Para determinar la ruta actual

    // Define si la ruta actual es una ruta de autenticación (login o registro)
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    // Mientras el estado de autenticación se está cargando inicialmente,
    // y no estamos en una ruta de login/registro, es mejor no renderizar nada o un spinner global.
    // ProtectedRoute ya maneja su propio spinner, por lo que null es seguro aquí.
    if (loading && !isAuthenticated && !isAuthRoute) {
        return null; 
    }
    
    return (
        <div className="App">
            {/* Sidebar y AppHeader se muestran solo si el usuario está autenticado y no está en una ruta de autenticación */}
            {isAuthenticated && !isAuthRoute && <Sidebar />}
            
            <div className={`main-layout-content ${isAuthenticated && !isAuthRoute ? "with-sidebar" : ""}`}>
                {isAuthenticated && !isAuthRoute && <AppHeader />}
                
                {/* El className de <main> se ajusta para centrar el contenido en rutas de autenticación */}
                <main className={isAuthenticated && !isAuthRoute ? "main-content-area" : "main-content-centered"}>
                    {/* El componente PageTitle que estaba aquí se ha movido a AppHeader */}
                    <Routes>
                        {/* Redirección de la ruta raíz: a dashboard si está logueado, sino a login */}
                        <Route 
                            path="/" 
                            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
                        />
                        
                        {/* Rutas de Autenticación (pueden usar un AuthLayout si se necesita un wrapper específico) */}
                        <Route element={<AuthLayout />}>
                            <Route 
                                path="/login" 
                                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
                            />
                            <Route 
                                path="/register" 
                                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
                            />
                        </Route>

                        {/* Rutas Protegidas (envueltas por ProtectedRoute) */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<NewDashboardPage />} />
                            <Route path="/objectives" element={<CreateGoalPage />} />
                            <Route path="/mis-objetivos" element={<MyObjectivesPage />} />
                            {/* Placeholder para otras rutas protegidas del sidebar */}
                            <Route path="/analisis" element={<div>Página de Análisis (Placeholder)</div>} />
                            <Route path="/perfil" element={<div>Página de Mi Perfil (Placeholder)</div>} />
                            <Route path="/configuracion" element={<div>Página de Configuración (Placeholder)</div>} />
                            
                            <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                            <Route path="/objectives/:id" element={<GoalDetailPage />} />
                            <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                            
                            {/* Fallback para cualquier otra ruta protegida no encontrada */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App;