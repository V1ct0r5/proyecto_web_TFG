import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "../src/pages/LoginPage";
import RegisterPage from "../src/pages/RegistroPage";
import ObjectivesPage from "../src/pages/ObjetivosPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/App.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <Router><AuthProvider><div className="App">
            <ToastContainer
                position="top-right" // Puedes cambiar la posición (top-left, bottom-center, etc.)
                autoClose={3000} // Tiempo en milisegundos para que se cierren automáticamente
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            /><Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/objectives"
                    element={
                        <ProtectedRoute>
                            <ObjectivesPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<LoginPage />} />
            </Routes></div></AuthProvider></Router>
    );
}

export default App;