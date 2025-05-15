import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "../src/pages/LoginPage";
import RegisterPage from "../src/pages/RegistroPage";
import ObjectivesPage from "../src/pages/ObjetivosPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/App.css";

function App() {
    return (
        <Router><AuthProvider><div className="App"><Routes>
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