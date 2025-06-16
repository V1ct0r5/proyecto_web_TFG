import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';
import api from "../services/apiService";
import { useAuth } from "../context/AuthContext";

import ObjetivosForm from "../components/objetivos/ObjetivosForm";
import styles from "./CreateGoalPage.module.css";

function CreateObjectivePage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    // El handler ahora recibe el payload ya formateado desde ObjetivosForm
    const handleObjectiveSubmission = async (payload) => {
        try {
            await api.createObjective(payload);
            toast.success(t('toast.objectiveCreateSuccess'));
            navigate('/dashboard', { replace: true });
        } catch (err) {
            // El interceptor de apiService se encarga del toast genérico
            console.error("Error al crear el objetivo:", err);
        }
    };

    const handleCancel = () => {
        toast.info(t('toast.objectiveCreateCancel'));
        navigate('/dashboard');
    };

    return (
        <div className={styles.createGoalPageContainer}>
            <div className={styles.formWrapper}>
                <h2 className={styles.formTitle}>
                    {user?.hasObjectives ? t('createGoalPage.title.new') : t('createGoalPage.title.first')}
                </h2>
                <ObjetivosForm
                    onSubmit={handleObjectiveSubmission}
                    onCancel={handleCancel}
                    isEditMode={false}
                />
            </div>
        </div>
    );
}

export default CreateObjectivePage;