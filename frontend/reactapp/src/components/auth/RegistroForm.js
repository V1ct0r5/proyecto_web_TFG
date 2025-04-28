import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


function RegistroForm() {
    const [username, setNombre] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Limpiar errores previos
        setSuccess(""); // Limpiar mensajes de éxito previos
        setLoading(true); // Iniciar el estado de carga

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try{
            const response = await axios.post("http://localhost:3000/api/auth/register", {
                nombre: username,
                correo_electronico: email,
                contrasena: password,
                confirmar_contrasena: confirmPassword,
            });

            // Si el registro es exitoso
            setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");

            // Opcional: Guardar el token y redirigir directamente a objetivos si el backend lo devuelve en el registro
            const { token } = response.data;
            if (token) {
                login(token); // Llamar a la función de login del contexto
                navigate('/objectives');
            } else {
                // Si el backend no devuelve token en el registro, redirigir al login después de un retardo
                setTimeout(() => {
                    navigate('/login');
                }, 2000); // Redirigir después de 2 segundos
            }
        } catch (err) {
            console.error("Error al registrar:", err);
            // Mostrar mensaje de error del backend si está disponible
            if (err.response && err.response.data && err.response.data.error) {
                // Para errores de validación, mostrar todos los errores
                setError(err.response.data.errors.map(error => error.msg).join(", "));
            } else if (error.response && error.response.data && error.response.data.error) {
                // Para errores generales, mostrar el mensaje de error
                setError(err.response.data.error);
            }
            else {
                setError("Error al registrar. Por favor, inténtalo de nuevo.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="username">Nombre de Usuario:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={loading} // Deshabilitar el campo si está cargando
                />
            </div>

            <div>
                <label htmlFor="email">Correo Electrónico:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading} // Deshabilitar el campo si está cargando
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
                    disabled={loading} // Deshabilitar el campo si está cargando
                />
            </div>

            <div>
                <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading} // Deshabilitar el campo si está cargando
                />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}
            <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
            </button>
        </form>
    );
}

export default RegistroForm;