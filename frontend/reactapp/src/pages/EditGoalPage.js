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
        const fetchObjective = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await api.getObjectiveById(id);
                setObjective(data);
            } catch (err) {
                setError(t('errors.objectiveLoadError'));
                toast.error(err.message || t('toast.objectiveLoadForEditError'));
                navigate('/mis-objetivos');
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
        navigate(`/objectives/${id}`); // Mejor volver a la página de detalles
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