import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ObjetivosForm from '../components/objetivos/ObjetivosForm';
import apiService from '../services/apiService';
import editGoalStyles from './EditGoalPage.module.css';

function EditGoalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [objective, setObjective] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchObjective = async () => {
            try {
                const data = await apiService.getObjectiveById(id);
                setObjective(data);
            } catch (err) {
                setError('Error al cargar el objetivo para edición.');
                // Considerar si la navegación en error de carga es la mejor UX,
                // podría ser preferible mostrar un mensaje en la página.
                navigate('/dashboard'); 
            } finally {
                setLoading(false);
            }
        };

        fetchObjective();
    }, [id, navigate]);

    const handleEditObjective = async (formData) => {
        try {
            await apiService.updateObjective(id, formData);
            navigate('/mis-objetivos');
        } catch (err) {
            // El error de apiService ya debería estar estructurado.
            // Considerar usar err.message o err.data.message para un mensaje más específico.
            setError('Error al actualizar el objetivo.');
        }
    };

    const handleCancelEdit = () => {
        navigate('/mis-objetivos');
    };

    if (loading) {
        return <div className={editGoalStyles.loadingState}>Cargando objetivo para edición...</div>;
    }

    if (error) {
        // Podría ser útil ofrecer al usuario una forma de reintentar o volver.
        return <div className={editGoalStyles.errorState}>{error}</div>;
    }

    if (!objective) {
        // Este caso podría ser manejado por el estado de error si fetchObjective falla.
        return <div className={editGoalStyles.noObjectiveFound}>Objetivo no encontrado.</div>;
    }

    return (
        <div className={editGoalStyles.editGoalContainer}>
            <div className={editGoalStyles.header}>
                <h1 className={editGoalStyles.pageTitle}>Editar Objetivo</h1>
            </div>
            <ObjetivosForm
                initialData={objective}
                onSubmit={handleEditObjective}
                buttonText="Guardar Cambios"
                isEditMode={true}
                onCancel={handleCancelEdit}
            />
        </div>
    );
}

export default EditGoalPage;