import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/apiService';

import ObjetivosForm from '../components/objetivos/ObjetivosForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './EditGoalPage.module.css';

function EditGoalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [objective, setObjective] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isNaN(parseInt(id))) {
            toast.error(t('errors.invalidObjectiveId'));
            navigate('/my-objectives');
            return;
        }
        const fetchObjective = async () => {
            setLoading(true);
            try {
                const response = await api.getObjectiveById(id);
                
                const objective = response?.data?.objective;
                
                if (!objective) {
                    throw new Error(t('errors.objectiveNotFound'));
                }
                
                setObjective(objective);
            } catch (err) {
                setError(err.message || t('errors.objectiveLoadError'));
                toast.error(err.message || t('toast.objectiveLoadForEditError'));
                navigate('/my-objectives');
            } finally {
                setLoading(false);
            }
        };
        fetchObjective();
    }, [id, navigate, t]);

    // El handler ahora recibe el payload ya preparado por ObjetivosForm
    const handleEditObjective = async (formData) => {
        try {
            await api.updateObjective(id, formData);
            toast.success(t('toast.objectiveUpdateSuccess'));
            navigate('/mis-objetivos');
        } catch (err) {
            toast.error(err.message || t('toast.objectiveUpdateError'));
        }
    };

    const handleCancelEdit = () => {
        navigate('/mis-objetivos'); // Mejor volver a la página de detalles
    };

    if (loading) {
        return <div className={styles.loadingState}><LoadingSpinner size="large" text={t('loaders.loadingObjectiveForEdit')} /></div>;
    }

    if (error) {
        return <div className={styles.errorState}>{error}</div>;
    }

    return (
        <div className={styles.editGoalContainer}>
            <h1 className={styles.pageTitle}>{t('pageTitles.editObjective')}</h1>
            {objective && (
                <ObjetivosForm
                    initialData={objective}
                    onSubmit={handleEditObjective}
                    isEditMode={true}
                    onCancel={handleCancelEdit}
                />
            )}
        </div>
    );
}

export default EditGoalPage;