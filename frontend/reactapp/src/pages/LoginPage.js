import React from "react";
import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function LoginPage() {
    const { t } = useTranslation();

    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">{t('loginPage.title')}</h1>
                <LoginForm />
                <p className="formFooter">
                    {t('loginPage.prompt')}{" "}
                    <Link to="/register" className="formLink">
                        {t('loginPage.registerLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;