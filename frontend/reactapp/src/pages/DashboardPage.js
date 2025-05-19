import React, { useEffect, useState } from "react";
import api from "../services/apiService";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ObjetivoCard from "../components/objetivos/ObjetivoCard";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import buttonStyles from "../components/ui/Button.module.css";

function DashboardPage() {
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { token, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && isAuthenticated && token) {
            const fetchObjectives = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await api.getObjectives();
                    setObjetivos(response.data);
                } catch (err) {
                    const errorMessage =
                        "Error al cargar tus objetivos. " +
                        (err.response?.data?.message || err.message || err.toString());
                    setError(errorMessage);
                    toast.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            fetchObjectives();
        } else {
            if (authLoading) {
                setLoading(true);
            } else {
                setLoading(false);
            }
        }
    }, [token, isAuthenticated, authLoading]);

    const handleNavigateToCreateObjective = () => {
        navigate("/objectives"); // <-- Redirige a la ruta de creación de objetivo
    };

    return (
        <div className="objetivos-page-content">
            <div>
                {!loading && !error && objetivos.length === 0 && (
                    <p>
                        Aún no tienes objetivos creados. Haz clic en "Añadir Nuevo Objetivo"
                        para crear el primero.
                    </p>
                )}
                {!loading && !error && objetivos.length > 0 && (
                    <>
                        <h2>Mis Objetivos</h2>
                        {objetivos.map((objetivo) => (
                            <div className="formContainer">
                                <ObjetivoCard
                                    key={objetivo.id_objetivo || objetivo.id}
                                    objective={objetivo}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
            <div className="add-objective-button-container">
                <Button
                    className={buttonStyles.buttonCreateObjective}
                    onClick={handleNavigateToCreateObjective}
                >
                    + Añadir Nuevo Objetivo
                </Button>
            </div>
            {loading && (
                <div className="loading-overlay">
                    <p>Cargando objetivos...</p>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;
