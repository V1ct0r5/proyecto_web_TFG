import React from "react";
import RegistrationForm from "../components/auth/RegistroForm";
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";

function RegistrationPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.mainContentArea}>
                <div className={styles.formContainer}>
                    <h1 className={styles.formTitle}>Crea tu cuenta</h1>
                    <RegistrationForm />
                    <p className={styles.formFooter}>¿Ya tienes una cuenta? <Link to="/login" className={styles.formLink}>Iniciar sesión</Link></p>
                </div>
            </div>
        </div>
    );
}

export default RegistrationPage;