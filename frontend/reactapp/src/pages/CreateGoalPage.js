// frontend/reactapp/src/pages/CreateGoalPage.js
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
    const { user } = useAuth(); // Usamos el contexto para saber si tiene objetivos
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleObjectiveSubmission = async (formData) => {
        setIsSubmitting(true);
        try {
            // Mapeo de datos del formulario al formato que espera la API
            // El formulario devuelve fechas como objetos Date, el servicio de API debería manejarlos
            // o se formatean aquí a 'yyyy-MM-dd' si es necesario.
            const payload = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                initialValue: formData.initialValue || 0, // Enviar 0 si está vacío
                targetValue: formData.targetValue,
                unit: formData.unit,
                isLowerBetter: formData.isLowerBetter,
                startDate: formData.startDate,
                endDate: formData.endDate,
            };
            
            await api.createObjective(payload);
            toast.success(t('toast.objectiveCreateSuccess'));
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error(err.message || t('toast.objectiveCreateErrorPrefix'));
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * 1. CREA ESTA FUNCIÓN PARA MANEJAR LA CANCELACIÓN
     * Esta función simplemente navega de vuelta al dashboard.
     */
    const handleCancel = () => {
        toast.info(t('toast.objectiveCreateCancel'));
        navigate('/dashboard');
    };

    return (
        <div className={styles.createGoalPageContainer}>
            <div className={styles.formWrapper}>
                <h2 className={styles.formTitle}>
                    {/* El título depende de si el usuario ya tiene objetivos */}
                    {user?.hasObjectives ? t('createGoalPage.title.new') : t('createGoalPage.title.first')}
                </h2>
                <ObjetivosForm
                    onSubmit={handleObjectiveSubmission}
                    onCancel={handleCancel} // 2. PASA LA FUNCIÓN DE CANCELACIÓN AL FORMULARIO
                    isEditMode={false}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}

export default CreateObjectivePage;
