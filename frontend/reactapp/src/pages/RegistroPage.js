import React from "react";
import RegistrationForm from "../components/auth/RegistroForm";
import { Link } from "react-router-dom";


function RegistrationPage() {
    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">Crea tu cuenta</h1>
                <RegistrationForm />
                <p className="formFooter">¿Ya tienes una cuenta? <Link to="/login" className="formLink">Iniciar sesión</Link></p>
                </div>
            </div>
    );
}

export default RegistrationPage;