// frontend/reactapp/src/pages/RegistrationPage.js
import React from "react";
import RegistrationForm from "../components/auth/RegistroForm"; // Asegúrate de tener este componente
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css"; // Asegúrate de que esta ruta sea correcta

function RegistrationPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.formContainer}>
                <h1 className={styles.formTitle}>Crea tu cuenta</h1>
                <RegistrationForm />
                <p className={styles.formFooter}>¿Ya tienes una cuenta? <Link to="/login" className={styles.formLink}>Iniciar sesión</Link></p>
            </div>
        </div>
    );
}

export default RegistrationPage;