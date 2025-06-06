import React from "react";
import RegistrationForm from "../components/auth/RegistroForm";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function RegistrationPage() {
    const { t } = useTranslation();
    return (
        <div className="page-centered-content">
            <div className="formContainer">
                <h1 className="formTitle">{t('registroPage.title')}</h1>
                <RegistrationForm />
                <p className="formFooter">
                    {t('registroPage.prompt')}{" "}
                    <Link to="/login" className="formLink">
                        {t('registroPage.loginLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegistrationPage;