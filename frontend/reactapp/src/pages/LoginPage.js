import React from "react";
import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";


function LoginPage() {
    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">Iniciar sesión</h1><LoginForm />
                <p className="formFooter">¿No tienes una cuenta? <Link to="/register" className="formLink">Regístrate</Link></p>
            </div>
        </div>
    );
}

export default LoginPage;