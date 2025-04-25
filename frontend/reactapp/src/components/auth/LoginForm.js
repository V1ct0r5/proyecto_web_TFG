import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginForm() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Limpiar errores previos
    
        try {
            const response = await axios.post("http://localhost:5000/api/login", {
                correo_electronico: email,
                contrasena: password,
            });

            // Si el login es exitoso, guardar el token en el localStorage
            const { token } = response.data;
            localStorage.setItem("token", token);

            // Redirigir al usuario a la página de objetivos
            navigate("/objectives");

        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            // Mostrar mensaje de error del backend si está disponible
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email">Correo Electrónico:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Contraseña:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Iniciar Sesión</button>
            <p>
                ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
            </p>
        </form>
    );
}

export default LoginForm;