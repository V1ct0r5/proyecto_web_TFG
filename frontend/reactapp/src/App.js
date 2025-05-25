// frontend/reactapp/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import CreateGoalPage from './pages/CreateGoalPage';
import DashboardPage from './pages/DashboardPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailPage from './pages/GoalDetailPage';
import UpdateProgressPage from './pages/UpdateProgressPage';

// Componentes/Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout'; // Podrías simplificar o eliminar este si ProtectedRoute es suficiente
import AppHeader from './layouts/AppHeader';
import Sidebar from './layouts/SideBar/SideBar'; // Asegúrate de que esta ruta sea correcta

// Estilos y Contexto
import './index.css'; // Si este archivo solo contiene cosas de React como "#root", está bien.
import './styles/App.css'; // Tu archivo CSS principal consolidado
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';

import { AuthProvider, useAuth } from './context/AuthContext'; // Importa useAuth también

// Componente para obtener el título dinámico de la página
// Este componente se muestra solo en rutas protegidas
const PageTitle = () => {
    const location = useLocation();
    const { isAuthenticated } = useAuth(); // Necesitamos saber si estamos autenticados para las rutas protegidas

    const getPageTitle = (pathname) => {
        if (!isAuthenticated) return ''; // No mostrar título en rutas no autenticadas (serán manejadas por los formularios)

        switch (pathname) {
            case '/dashboard':
                return 'Panel de Control';
            case '/objectives': // Esta es la ruta para crear objetivo (según tu provided App.js)
                return 'Crear Objetivo';
            case '/mis-objetivos': // Nueva ruta para listar objetivos, si la añades
                return 'Mis Objetivos';
            case '/analisis':
                return 'Análisis de Progreso';
            case '/perfil':
                return 'Mi Perfil';
            case '/configuracion':
                return 'Configuración';
            // Para rutas con parámetros
            case pathname.match(/\/objectives\/\d+$/)?.input:
                return 'Detalles del Objetivo';
            case pathname.match(/\/objectives\/edit\/\d+$/)?.input:
                return 'Editar Objetivo';
            case pathname.match(/\/objectives\/\d+\/update-progress$/)?.input:
                return 'Actualizar Progreso';
            default:
                return 'GoalMaster'; // Título por defecto para rutas autenticadas no específicas
        }
    };

    const title = getPageTitle(location.pathname);
    if (!title) return null; // No renderizar nada si el título está vacío

    return (
        <h1 className="page-title">{title}</h1>
    );
};


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent /> {/* Nuevo componente para manejar la lógica de layout y autenticación */}
            </BrowserRouter>
            <ToastContainer position="bottom-right" autoClose={1500} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </AuthProvider>
    );
}

// Componente auxiliar para el contenido principal de la aplicación,
// permite usar useAuth y useLocation dentro del BrowserRouter.
function AppContent() {
    const { isAuthenticated } = useAuth(); // Obtiene el estado de autenticación
    const location = useLocation(); // Para saber la ruta actual

    // Determina si estamos en una ruta de autenticación (login o registro)
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div className="App">
            {/* Sidebar solo se muestra si el usuario está autenticado Y NO estamos en una ruta de autenticación */}
            {isAuthenticated && !isAuthRoute && <Sidebar />}

            {/* Contenedor principal del contenido: AppHeader (si autenticado) y main */}
            <div className="main-layout-content">
                {/* AppHeader solo se muestra si el usuario está autenticado Y NO estamos en una ruta de autenticación */}
                {isAuthenticated && !isAuthRoute && <AppHeader />}

                {/* El main contendrá las rutas. Su clase cambiará para centrar si no hay sidebar/header */}
                <main className={isAuthenticated && !isAuthRoute ? "main-content-area" : "main-centered-auth"}>
                    {/* El título de la página (dinámico) se muestra solo si está autenticado y no es una ruta de auth */}
                    {isAuthenticated && !isAuthRoute && <PageTitle />}

                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Rutas protegidas */}
                        <Route element={<AuthLayout />}>
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/objectives" element={<CreateGoalPage />} /> {/* Tu ruta original para crear */}
                                {/* Agregamos una ruta para "Mis Objetivos" si el Sidebar la usa */}
                                <Route path="/mis-objetivos" element={<div>Página de Mis Objetivos (aquí iría tu componente MisObjetivosPage)</div>} />
                                {/* Puedes añadir más rutas para los ítems del Sidebar aquí, por ejemplo: */}
                                <Route path="/analisis" element={<div>Página de Análisis (aquí iría tu componente AnalisisPage)</div>} />
                                <Route path="/perfil" element={<div>Página de Mi Perfil (aquí iría tu componente PerfilPage)</div>} />
                                <Route path="/configuracion" element={<div>Página de Configuración (aquí iría tu componente ConfiguracionPage)</div>} />

                                <Route path="/objectives/edit/:id" element={<EditGoalPage />} />
                                <Route path="/objectives/:id" element={<GoalDetailPage />} />
                                <Route path="/objectives/:id/update-progress" element={<UpdateProgressPage />} />
                                {/* Ruta de fallback para cualquier otra URL protegida que no exista */}
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Route>
                        </Route>
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App;