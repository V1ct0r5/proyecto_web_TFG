import React from 'react';
import { BrowserRouter, Routes, Route, Navigate  } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistroPage';
import ObjetivosPage from './pages/ObjetivosPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';

import { AuthProvider } from './context/AuthContext';

import AuthLayout from './layouts/AuthLayout';
import AppHeader from './layouts/AppHeader';


function App() {
    return (
        <AuthProvider>
            <div className="App">
                <BrowserRouter>
                    <AppHeader />
                    <main>
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route element={<AuthLayout />}>
                                <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/objectives" element={<ObjetivosPage />} />
                                </Route>
                            </Route>
                        </Routes>
                    </main>
                </BrowserRouter>
                <ToastContainer position="bottom-right" autoClose={1500} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            </div>
        </AuthProvider>
    );
}

export default App;