import React from "react";
import RegistrationForm from "../components/auth/RegistroForm"; // Importa el componente del formulario de registro
import { Link } from "react-router-dom"; // Importa Link para la navegación interna
// import styles from "../layouts/AuthLayout.module.css"; // Importa estilos de layout si se usan directamente

// Página de registro de usuario
function RegistrationPage() {
    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">Crea tu cuenta</h1>
                <RegistrationForm />
                <p className="formFooter">
                    ¿Ya tienes una cuenta?{" "}
                    <Link to="/login" className="formLink">
                        Iniciar sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegistrationPage;