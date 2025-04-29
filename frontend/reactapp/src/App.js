import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from '../src/pages/LoginPage';
import RegisterPage from '../src/pages/RegistroPage';
import ObjectivesPage from '../src/pages/ObjetivosPage';
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      {/* El AuthProvider envuelve toda la aplicación para proporcionar el contexto de autenticación */}
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas protegidas */}
            <Route 
              path="/objectives" 
              element={
                <ProtectedRoute>
                  <ObjectivesPage />
                </ProtectedRoute>
              } 
            />

            <Route path="/" element={<LoginPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;