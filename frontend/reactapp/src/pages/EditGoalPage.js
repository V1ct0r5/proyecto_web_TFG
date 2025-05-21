// frontend/reactapp/src/pages/EditGoalPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ObjetivosForm from '../components/objetivos/ObjetivosForm';
import apiService from '../services/apiService';
import editGoalStyles from './EditGoalPage.module.css'; // Importa los estilos para esta página
// No necesitamos importar Button aquí si el botón de cancelar se va al formulario

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
                console.error('Error fetching objective for edit:', err);
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
            navigate('/dashboard');
        } catch (err) {
            setError('Error al actualizar el objetivo.');
            console.error('Error updating objective:', err);
        }
    };

    const handleCancelEdit = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return <div className={editGoalStyles.loadingState}>Cargando objetivo para edición...</div>;
    }

    if (error) {
        return <div className={editGoalStyles.errorState}>{error}</div>;
    }

    if (!objective) {
        return <div className={editGoalStyles.noObjectiveFound}>Objetivo no encontrado.</div>;
    }

    return (
        <div className={editGoalStyles.editGoalContainer}>
            {/* *** RESTAURADO: el div.header con el título de la página *** */}
            <div className={editGoalStyles.header}>
                <h1 className={editGoalStyles.pageTitle}>Editar Objetivo</h1>
                {/* NOTA: El botón de "Cancelar" YA NO VA AQUÍ. Lo manejará ObjetivosForm */}
            </div>
            <ObjetivosForm
                initialData={objective}
                onSubmit={handleEditObjective}
                buttonText="Guardar Cambios"
                isEditMode={true}
                onCancel={handleCancelEdit} // ¡CLAVE! Pasar la función de cancelar al formulario
            />
        </div>
    );
}

export default EditGoalPage;