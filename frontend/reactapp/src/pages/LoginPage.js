import React from "react";
import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css"



function LoginPage() {
    return (
        <div className={styles.authPage}>
            <div className={styles.mainContentArea}>
                <div className={styles.formContainer}>
                    <h1 className={styles.formTitle}>Iniciar sesión</h1><LoginForm />
                    <p className={styles.formFooter}>¿No tienes una cuenta? <Link to="/register" className={styles.formLink}>Regístrate</Link></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;