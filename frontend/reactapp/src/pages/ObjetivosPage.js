import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ObjetivosForm from "../components/objetivos/ObjetivosForm";

function ObjetivosPage() {
    const [hasObjectives, setHasObjectives] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkObjectives = async () => {
            const token = localStorage.getItem("token"); // Obtener el token del almacenamiento local
            if (!token) {
                navigate("/login"); // Redirigir al usuario a la página de inicio de sesión
                return;
            }

            try {
                const response = await axios.get("http://localhost:8000/api/objetives", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Comprobar si el usuario ya tiene objetivos
                if (response.data && response.data.length > 0) {
                    setHasObjectives(true);
                } else {
                    setHasObjectives(false);
                }
            } catch (error) {
                console.error("Error al verificar los objetivos:", error);
                // Si el error es 401 o 403, redirigir al usuario a la página de inicio de sesión
                if(error.response && (error.response.status === 401 || error.response.status === 403)) {
                    navigate("/login");
                } else {
                    setError("Error al cargar tus objetivos.");
                }
            } finally {
                setLoading(false); // Finalizar la carga
            }
        };

        checkObjectives();
    }, [navigate]); // Eliminar la dependencia de navigate para evitar bucles infinitos

    // Función que se ejecutará cuando el formulario de objetivos se envíe con éxito
    const handleObjectiveCreated = () => {
        setHasObjectives(true); // Actualizar el estado para indicar que el usuario tiene objetivos
    };
    
    if(loading) {
        return <div>Cargando...</div>; // Mostrar un mensaje de carga mientras se verifica el estado
    }

    if(error) {
        return <div style={{ color: 'red' }}>{error}</div>; // Mostrar un mensaje de error si ocurre un problema
    }

    return (
        <div className="objetivos">
        <h1>Mis Objetivos</h1>
        { !hasObjectives ? (
            <div>
                <h2>Parece que no tienes objetivos todavía. ¡Vamos a crear el primero!</h2>
                <ObjetivosForm onObjectiveCreated={handleObjectiveCreated} /> {/* Pasar la función de manejo de envío */}
            </div>
        ) : (
            <div>
                {/* Aquí se mostrará la lista de objetivos una vez implementada */}
                <h2>Tus objetivos ya han sido establecidos. Aquí los tienes:</h2>
            {/* <ListaObjetivos /> */}
            </div>
        )}
        </div>
    );
}

export default ObjetivosPage;