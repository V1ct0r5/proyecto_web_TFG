import React from "react";
import LoginForm from "../components/auth/LoginForm"; // Importa el componente del formulario de login
import { Link } from "react-router-dom"; // Importa Link para la navegación interna

// Página de inicio de sesión
function LoginPage() {
    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">Iniciar sesión</h1>
                <LoginForm />
                <p className="formFooter">
                    ¿No tienes una cuenta?{" "}
                    <Link to="/register" className="formLink"> {/* Link a la página de registro */}
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;