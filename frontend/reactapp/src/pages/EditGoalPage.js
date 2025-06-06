import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ObjetivosForm from '../components/objetivos/ObjetivosForm';
import apiService from '../services/apiService';
import editGoalStyles from './EditGoalPage.module.css';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';

function EditGoalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [objective, setObjective] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchObjective = async () => {
            try {
                const data = await apiService.getObjectiveById(id);
                setObjective(data);
            } catch (err) {
                const errorMsg = t('toast.objectiveLoadForEditError');
                setError(errorMsg);
                toast.error(errorMsg);
                navigate('/dashboard'); 
            } finally {
                setLoading(false);
            }
        };

        fetchObjective();
    }, [id, navigate, t]);

    const handleEditObjective = async (formData) => {
        try {
            await apiService.updateObjective(id, formData);
            navigate('/mis-objetivos');
        } catch (err) {
            const errorMsg = t('toast.objectiveUpdateError');
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleCancelEdit = () => {
        navigate('/mis-objetivos');
    };

    if (loading) {
        return <div className={editGoalStyles.loadingState}><LoadingSpinner size="large" text={t('loaders.loadingObjectiveForEdit')} /></div>;
    }

    if (error) {
        return <div className={editGoalStyles.errorState}>{error}</div>;
    }

    if (!objective) {
        return <div className={editGoalStyles.noObjectiveFound}>{t('errors.objectiveNotFound')}</div>;
    }

    return (
        <div className={editGoalStyles.editGoalContainer}>
            <div className={editGoalStyles.header}>
                <h1 className={editGoalStyles.pageTitle}>{t('pageTitles.editObjective')}</h1>
            </div>
            <ObjetivosForm
                initialData={objective}
                onSubmit={handleEditObjective}
                buttonText={t('common.saveChanges')}
                isEditMode={true}
                onCancel={handleCancelEdit}
            />
        </div>
    );
}

export default EditGoalPage;