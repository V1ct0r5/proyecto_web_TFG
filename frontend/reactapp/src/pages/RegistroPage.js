import React from "react";
import RegistroForm from "../components/auth/RegistroForm";
import { Link } from "react-router-dom";

function RegistroPage() {
    return (
        <div className="registro">
        <h1>Registro de usuario</h1>
        <RegistroForm />
        <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
        </div>
    );
}

export default RegistroPage;