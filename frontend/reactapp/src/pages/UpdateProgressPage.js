import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService'; // Asegúrate de que la ruta sea correcta
import { toast } from 'react-toastify';
import styles from './UpdateProgressPage.module.css'; // Ruta al archivo CSS del módulo
import LoadingSpinner from '../components/ui/LoadingSpinner'; // Asume que tienes un componente LoadingSpinner
import Button from '../components/ui/Button'; // Asume que tienes un componente Button
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale'; // Para formatear fechas en español

function UpdateProgressPage() {
    const { id } = useParams(); // Obtener el ID del objetivo de la URL
    const navigate = useNavigate();

    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProgressValue, setNewProgressValue] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchGoalDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getObjectiveById(id);
            setGoalData(data);
            // Pre-llenar el 'Nuevo Valor' con el valor actual del objetivo
            // Si valor_actual es null/undefined, usa valor_inicial_numerico como base.
            setNewProgressValue(data.valor_actual !== null && data.valor_actual !== undefined
                ? String(data.valor_actual)
                : String(data.valor_inicial_numerico || '')
            );
            console.log("Datos del objetivo cargados para actualización:", data);
        } catch (err) {
            console.error("Error al cargar los detalles del objetivo para actualización:", err);
            setError("No se pudo cargar el objetivo. Por favor, inténtalo de nuevo más tarde.");
            toast.error("Error al cargar el objetivo.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchGoalDetails();
        }
    }, [id, fetchGoalDetails]);

    const handleValueChange = (e) => {
        // Permitir solo números y un punto decimal
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === '') {
            setNewProgressValue(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!goalData) {
            toast.error("No se han cargado los datos del objetivo.");
            setIsSubmitting(false);
            return;
        }
        console.log("Valor de newProgressValue antes de parsear:", newProgressValue);
        const valueToUpdate = parseFloat(newProgressValue);

        if (isNaN(valueToUpdate)) {
            toast.error("Por favor, introduce un valor numérico válido para el progreso.");
            setIsSubmitting(false);
            return;
        }

        // Determinar el nuevo estado basado en el valor actual y el objetivo
        let newStatus = goalData.estado; // Mantener el estado actual por defecto

        const targetValue = Number(goalData.valor_cuantitativo);
        const isLowerBetter = goalData.es_menor_mejor;

        if (!isNaN(targetValue)) {
            if (isLowerBetter) {
                if (valueToUpdate <= targetValue) {
                    newStatus = 'Completado';
                } else if (newStatus === 'Completado') {
                    // Si ya estaba completado pero el nuevo valor lo saca de ese estado
                    newStatus = 'En progreso';
                }
            } else { // Mayor es mejor
                if (valueToUpdate >= targetValue) {
                    newStatus = 'Completado';
                } else if (newStatus === 'Completado') {
                    // Si ya estaba completado pero el nuevo valor lo saca de ese estado
                    newStatus = 'En progreso';
                }
            }
        }


        // Construir el objeto de datos para la actualización
        const updateData = {
            valor_actual: valueToUpdate,
            estado: newStatus, // Actualizar el estado basado en la lógica de progreso
            // La nota se puede añadir si tu backend la soporta en la actualización del objetivo
            // o si tienes un endpoint específico para "actualizaciones de progreso"
            notas: notes
        };

        try {
            await apiService.updateObjective(id, updateData);
            toast.success("Progreso actualizado con éxito.");
            navigate(`/objectives/${id}`); // Redirigir a la página de detalle del objetivo
        } catch (err) {
            console.error("Error al actualizar el progreso:", err);
            setError(`Error al actualizar el progreso: ${err.response?.data?.message || err.message}`);
            toast.error(`Error al actualizar el progreso: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateProgressPercentage = useCallback(() => {
        if (!goalData) return 0;

        const initialValue = Number(goalData.valor_inicial_numerico || 0);
        const targetValue = Number(goalData.valor_cuantitativo || 0);
        const isLowerBetter = goalData.es_menor_mejor;

        // Si newProgressValue está vacío, usa el valor actual del objetivo, si no el inicial.
        // Esto es importante para que la barra muestre el progreso "actual" al cargar la página.
        const currentVal = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue))
            ? parseFloat(newProgressValue)
            : (goalData.valor_actual !== null && goalData.valor_actual !== undefined && !isNaN(Number(goalData.valor_actual)))
                ? Number(goalData.valor_actual)
                : initialValue;


        if (isNaN(initialValue) || isNaN(targetValue) || initialValue === null || targetValue === null || targetValue === 0) {
            // Si el objetivo es 0 y el valor actual es 0, el progreso es 100% si es "mayor es mejor"
            // O 0% si "menor es mejor"
            if (targetValue === 0 && currentVal === 0) return isLowerBetter ? 0 : 100;
            return 0; // No se puede calcular si los valores no son válidos o el objetivo es 0 (para mayor es mejor)
        }

        let progress = 0;

        if (isLowerBetter) {
            // Si el valor actual ya es menor o igual al objetivo, es 100%
            if (currentVal <= targetValue) {
                return 100;
            }
            // Para "menor es mejor", el rango va del inicial al objetivo.
            // Si inicial es 10 y objetivo es 0, el rango es 10.
            // Si actual es 5, el progreso es (10-5)/10 = 50%
            const range = initialValue - targetValue;
            const currentProgressDelta = initialValue - currentVal;

            if (range === 0) {
                progress = (currentVal <= targetValue) ? 100 : 0;
            } else {
                progress = (currentProgressDelta / range) * 100;
            }
        } else { // Mayor es mejor
            // Si el valor actual ya es mayor o igual al objetivo, es 100%
            if (currentVal >= targetValue) {
                return 100;
            }
            const range = targetValue - initialValue;
            const currentProgressDelta = currentVal - initialValue;

            if (range === 0) {
                 progress = 0; // Evitar división por cero si no hay rango
            } else {
                progress = (currentProgressDelta / range) * 100;
            }
        }

        return Math.max(0, Math.min(100, progress)); // Asegurarse de que esté entre 0 y 100
    }, [goalData, newProgressValue]);

    const progressPercentage = calculateProgressPercentage();

    // Obtener la última fecha de actualización
    const lastUpdateDate = useMemo(() => {
        // Preferir fecha_ultima_actualizacion si existe y es válida
        if (goalData && goalData.fecha_ultima_actualizacion && isValid(parseISO(goalData.fecha_ultima_actualizacion))) {
            return format(parseISO(goalData.fecha_ultima_actualizacion), 'd/M/yyyy', { locale: es });
        }
        // Si no, usar fecha_creacion si existe y es válida (como un fallback razonable)
        if (goalData && goalData.fecha_creacion && isValid(parseISO(goalData.fecha_creacion))) {
            return format(parseISO(goalData.fecha_creacion), 'd/M/yyyy', { locale: es });
        }
        return 'N/A'; // Si no hay ninguna fecha válida
    }, [goalData]);


    if (loading) {
        return (
            <div className={styles.updateProgressPage}>
                <LoadingSpinner />
                <p>Cargando objetivo para actualización...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.updateProgressPage} ${styles.updateProgressPageError}`}>
                <p>{error}</p>
                <Button onClick={() => navigate(`/objectives/${id}`)}>Volver al Objetivo</Button>
            </div>
        );
    }

    if (!goalData) {
        return (
            <div className={styles.updateProgressPage}>
                <p>No se encontró el objetivo para actualizar.</p>
                <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
            </div>
        );
    }

    // Comprobar si el objetivo es cuantitativo
    const isQuantitative = (
        (goalData.valor_cuantitativo !== null && goalData.valor_cuantitativo !== undefined && !isNaN(Number(goalData.valor_cuantitativo))) &&
        (goalData.valor_inicial_numerico !== null && goalData.valor_inicial_numerico !== undefined && !isNaN(Number(goalData.valor_inicial_numerico)))
    );

    if (!isQuantitative) {
        return (
            <div className={`${styles.updateProgressPage} ${styles.nonQuantitativeMessage}`}>
                <h2 className={styles.nonQuantitativeMessageTitle}>Actualizar Progreso: {goalData.nombre}</h2>
                <p className={styles.nonQuantitativeMessageText}>Este objetivo no es cuantitativo y no se puede actualizar su progreso numéricamente.</p>
                <p className={styles.nonQuantitativeMessageText}>Por favor, edita el objetivo para cambiar su estado (Pendiente, En progreso, Completado).</p>
                <div className={styles.nonQuantitativeMessageActions}>
                    <Button onClick={() => navigate(`/objectives/${id}`)} variant="secondary">
                        Volver al Objetivo
                    </Button>
                    <Button onClick={() => navigate(`/objectives/edit/${id}`)}>
                        Editar Objetivo
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.updateProgressPage}>
            <div className={styles.updateProgressCard}>
                <div className={styles.updateProgressHeader}>
                    <h1 className={styles.goalTitle}>{goalData.nombre}</h1>
                    <p className={styles.goalDescription}>{goalData.descripcion || 'Sin descripción.'}</p>
                </div>

                <div className={styles.progressSection}>
                    <h2 className={styles.sectionHeading}>Progreso Actual</h2>

                    {/* ESTRUCTURA DE LA BARRA DE PROGRESO - Adaptada de ObjetivoCard */}
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarHeader}>
                            <span className={styles.progressBarLabel}>Progreso</span>
                            <span className={styles.progressBarPercentage}>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressBarFill} ${progressPercentage < 33 ? styles.progressFillLow : progressPercentage < 66 ? styles.progressFillMedium : styles.progressFillHigh}`}
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                    {/* FIN DE LA ESTRUCTURA DE LA BARRA DE PROGRESO */}

                    <div className={styles.progressDetails}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Valor Actual</span>
                            <span className={styles.detailValue}>
                                {/* Mostrar newProgressValue si existe, si no el valor actual del objetivo */}
                                {newProgressValue !== '' && !isNaN(parseFloat(newProgressValue))
                                    ? parseFloat(newProgressValue).toFixed(1)
                                    : (goalData.valor_actual !== null && goalData.valor_actual !== undefined && !isNaN(Number(goalData.valor_actual))
                                        ? Number(goalData.valor_actual).toFixed(1)
                                        : Number(goalData.valor_inicial_numerico || 0).toFixed(1))} {goalData.unidad_medida || ''}
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Valor Objetivo</span>
                            <span className={styles.detailValue}>
                                {Number(goalData.valor_cuantitativo || 0).toFixed(0)} {goalData.unidad_medida || ''}
                            </span>
                        </div>
                    </div>
                    <p className={styles.lastUpdateInfo}>
                        Última actualización: <span className={styles.lastUpdateDate}>{lastUpdateDate}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.updateForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newProgressValue" className={styles.formLabel}>Nuevo Valor</label>
                        <input
                            type="text" // Usar 'text' para permitir la entrada de decimales libremente antes de parsear
                            id="newProgressValue"
                            className={styles.formInput}
                            value={newProgressValue}
                            onChange={handleValueChange}
                            placeholder={`Introduce el nuevo valor en ${goalData.unidad_medida || ''}`}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="notes" className={styles.formLabel}>Notas (Opcional)</label>
                        <textarea
                            id="notes"
                            className={styles.formTextarea}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Añade notas sobre este avance..."
                            rows="4"
                        ></textarea>
                    </div>

                    <div className={styles.formActions}>
                        <Button
                            type="button"
                            onClick={() => navigate(`/objectives/${id}`)}
                            variant="secondary"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Progreso'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateProgressPage;