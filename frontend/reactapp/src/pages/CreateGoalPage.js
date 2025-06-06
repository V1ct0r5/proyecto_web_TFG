import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ObjetivosForm from "../components/objetivos/ObjetivosForm";
import api from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import styles from "./CreateGoalPage.module.css";
import { toast } from 'react-toastify';
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useTranslation } from "react-i18next";

function CreateObjectivePage() {
    const { t } = useTranslation();
    const [objetivos, setObjetivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const [pageMessage, setPageMessage] = useState('');

    useEffect(() => {
        if (location.state?.message) {
            setPageMessage(location.state.message);
        }
    }, [location.state]);

    const handleObjectiveSubmission = async (objectiveData) => {
        setIsSubmitting(true);
        try {
            await api.createObjective(objectiveData);
            toast.success(t('toast.objectiveCreateSuccess'));
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error desconocido al crear el objetivo.";
            toast.error(`${t('toast.objectiveCreateErrorPrefix')} ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelCreation = () => {
        if (objetivos.length > 0) {
            navigate('/dashboard');
        } else {
            navigate('/dashboard');
        }
        toast.info(t('toast.objectiveCreateCancel'));
    };

    const fetchInitialObjectivesForTitle = useCallback(async () => {
        try {
            const data = await api.getObjectives();
            setObjetivos(Array.isArray(data) ? data : []);
        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                toast.error(t('toast.sessionExpiredOrUnauthorized'));
                logout();
                navigate("/login", { replace: true, state: { from: location } });
            }
            setObjetivos([]);
        }
    }, [navigate, logout, location, t]);

    useEffect(() => {
        setLoading(true);
        fetchInitialObjectivesForTitle().finally(() => {
            setLoading(false);
        });
    }, [fetchInitialObjectivesForTitle]);

    if (loading) {
        return (
            <div className={styles.pageLoadingContainer}>
                <LoadingSpinner size="large" text={t('loaders.preparingForm')} />
            </div>
        );
    }

    return (
        <div className={styles.createGoalPageContainer}>
            <div className={styles.formWrapper}>
                {pageMessage && <p className={styles.pageInfoMessage}>{pageMessage}</p>}
                <h2 className={styles.formTitle}>
                    {objetivos.length > 0 ? t('createGoalPage.title.new') : t('createGoalPage.title.first')}
                </h2>
                <ObjetivosForm
                    onSubmit={handleObjectiveSubmission}
                    isEditMode={false}
                    buttonText={t('objectivesForm.createButton')}
                    onCancel={handleCancelCreation}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}

export default CreateObjectivePage;