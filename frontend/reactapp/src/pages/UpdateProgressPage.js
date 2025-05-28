import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './UpdateProgressPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const determineNewStatusLogic = (currentValueNum, targetValueStr, initialValueStr, currentStatus, isLowerBetter, tipoObjetivo) => {
    const numericTarget = Number(targetValueStr);
    const numericInitial = Number(initialValueStr);
    const isEffectivelyQuantitative =
        typeof tipoObjetivo === 'string' &&
        initialValueStr !== null && typeof initialValueStr !== 'undefined' && !isNaN(numericInitial) &&
        targetValueStr !== null && typeof targetValueStr !== 'undefined' && !isNaN(numericTarget);

    if (!isEffectivelyQuantitative || isNaN(currentValueNum)) {
        return currentStatus;
    }
    let newCalculatedStatus = currentStatus;
    if (isLowerBetter) {
        if (currentValueNum <= numericTarget) newCalculatedStatus = 'Completado';
    } else {
        if (currentValueNum >= numericTarget) newCalculatedStatus = 'Completado';
    }
    if (newCalculatedStatus !== 'Completado') {
        if (currentStatus === 'Pendiente') {
            if (currentValueNum !== numericInitial) newCalculatedStatus = 'En progreso';
        } else if (currentStatus === 'Completado') {
            newCalculatedStatus = 'En progreso';
        }
    }
    return newCalculatedStatus;
};

function UpdateProgressPage() {
    const { id: objectiveId } = useParams();
    const navigate = useNavigate();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProgressValue, setNewProgressValue] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchGoalDetails = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await apiService.getObjectiveById(objectiveId);
            setGoalData(data);
            const initialDisplayValue = (data.valor_actual !== null && data.valor_actual !== undefined)
                ? String(data.valor_actual)
                : (data.valor_inicial_numerico !== null && data.valor_inicial_numerico !== undefined) ? String(data.valor_inicial_numerico) : '';
            setNewProgressValue(initialDisplayValue);
        } catch (err) {
            setError("No se pudo cargar el objetivo. Por favor, inténtalo de nuevo más tarde.");
            toast.error("Error al cargar el objetivo.");
        } finally { setLoading(false); }
    }, [objectiveId]);

    useEffect(() => { if (objectiveId) fetchGoalDetails(); }, [objectiveId, fetchGoalDetails]);

    const handleValueChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === '') setNewProgressValue(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        if (!goalData) {
            toast.error("No se han cargado los datos del objetivo.");
            setIsSubmitting(false); return;
        }
        if (newProgressValue.trim() === '') {
            toast.error("Por favor, introduce un valor numérico para el progreso.");
            setIsSubmitting(false); return;
        }
        const valueToUpdate = parseFloat(newProgressValue);
        if (isNaN(valueToUpdate)) {
            toast.error("Por favor, introduce un valor numérico válido para el progreso.");
            setIsSubmitting(false); return;
        }

        const calculatedNewStatus = determineNewStatusLogic(
            valueToUpdate, goalData.valor_cuantitativo, goalData.valor_inicial_numerico,
            goalData.estado, goalData.es_menor_mejor, goalData.tipo_objetivo
        );

        const payload = {
            estado: calculatedNewStatus,
            progressData: {
                valor_actual: valueToUpdate,
                comentarios: notes.trim() === '' ? null : notes.trim()
            }
        };

        try {
            await apiService.updateObjective(objectiveId, payload);
            toast.success("Progreso actualizado con éxito.");
            navigate(`/objectives/${objectiveId}`);
        } catch (err) {
            const errorMessage = err.response?.data?.validationErrors?.[0]?.msg || err.response?.data?.message || err.message || "Error desconocido al actualizar";
            setError(`Error al actualizar el progreso: ${errorMessage}`);
            toast.error(`Error al actualizar el progreso: ${errorMessage}`);
        } finally { setIsSubmitting(false); }
    };

    const progressPercentage = useMemo(() => {
        if (!goalData) return 0;
        const initial = Number(goalData.valor_inicial_numerico || 0);
        const targetStr = goalData.valor_cuantitativo;
        const target = (targetStr !== null && targetStr !== undefined && !isNaN(Number(targetStr))) ? Number(targetStr) : NaN;
        const isLower = goalData.es_menor_mejor;
        const current = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue))
            ? parseFloat(newProgressValue)
            : (goalData.valor_actual !== null && goalData.valor_actual !== undefined && !isNaN(Number(goalData.valor_actual))) ? Number(goalData.valor_actual) : initial;
        if (isNaN(initial) || isNaN(target) || isNaN(current)) return 0;
        if (initial === target) return (isLower ? current <= target : current >= target) ? 100 : 0;
        let prog = 0;
        if (isLower) {
            if (initial <= target) return (current <= target) ? 100 : 0; // Already better or at target
            const range = initial - target;
            prog = range === 0 ? ((initial - current) <=0 ? 100 : 0) : ((initial - current) / range) * 100;
        } else {
            if (initial >= target) return (current >= target) ? 100 : 0; // Already better or at target
            const range = target - initial;
            prog = range === 0 ? ((current - initial) >=0 ? 100 : 0) : ((current - initial) / range) * 100;
        }
        return Math.max(0, Math.min(100, prog));
    }, [goalData, newProgressValue]);

    const lastUpdateDate = useMemo(() => {
        let mostRecentDateString = goalData?.updatedAt;
        if (goalData?.historial_progreso && goalData.historial_progreso.length > 0) {
            const lastProgressEntry = goalData.historial_progreso[goalData.historial_progreso.length - 1];
            if (lastProgressEntry?.updatedAt) mostRecentDateString = lastProgressEntry.updatedAt;
            else if (lastProgressEntry?.date) mostRecentDateString = lastProgressEntry.date;
        }
        if (!mostRecentDateString || !isValid(parseISO(mostRecentDateString))) mostRecentDateString = goalData?.createdAt;
        if (mostRecentDateString && isValid(parseISO(mostRecentDateString))) return format(parseISO(mostRecentDateString), 'd/M/yyyy HH:mm', { locale: es });
        return 'N/A';
    }, [goalData]);

    const displayCurrentValue = useMemo(() => {
        if (!goalData) return '0.0';
        let valueToShow;
        if (newProgressValue !== '' && !isNaN(parseFloat(newProgressValue))) valueToShow = parseFloat(newProgressValue);
        else if (goalData.valor_actual !== null && goalData.valor_actual !== undefined && !isNaN(Number(goalData.valor_actual))) valueToShow = Number(goalData.valor_actual);
        else valueToShow = Number(goalData.valor_inicial_numerico || 0);
        return valueToShow.toFixed(1);
    }, [newProgressValue, goalData]);

    if (loading) return (<div className={styles.updateProgressPage}><LoadingSpinner /><p>Cargando objetivo para actualización...</p></div>);
    if (error && !goalData) return (<div className={`${styles.updateProgressPage} ${styles.updateProgressPageError}`}><p>{error}</p><Button onClick={() => navigate('/')}>Volver al Dashboard</Button></div>);
    if (!goalData) return (<div className={styles.updateProgressPage}><p>No se encontró el objetivo para actualizar o no se pudo cargar.</p><Button onClick={() => navigate('/')}>Volver al Dashboard</Button></div>);

    const isQuantitative = (
        (goalData.valor_cuantitativo !== null && goalData.valor_cuantitativo !== undefined && !isNaN(Number(goalData.valor_cuantitativo))) &&
        (goalData.valor_inicial_numerico !== null && goalData.valor_inicial_numerico !== undefined && !isNaN(Number(goalData.valor_inicial_numerico)))
    );

    if (!isQuantitative) return ( <div className={`${styles.updateProgressPage} ${styles.nonQuantitativeMessage}`}><h2 className={styles.nonQuantitativeMessageTitle}>Actualizar Progreso: {goalData.nombre}</h2><p className={styles.nonQuantitativeMessageText}>Este objetivo no es cuantitativo y no se puede actualizar su progreso numéricamente.</p><p className={styles.nonQuantitativeMessageText}>Por favor, edita el objetivo para cambiar su estado (Pendiente, En progreso, Completado).</p><div className={styles.nonQuantitativeMessageActions}><Button onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary">Volver al Objetivo</Button><Button onClick={() => navigate(`/objectives/edit/${objectiveId}`)}>Editar Objetivo</Button></div></div>);

    return (
        <div className={styles.updateProgressPage}>
            <div className={styles.updateProgressCard}>
                <div className={styles.updateProgressHeader}>
                    <h1 className={styles.goalTitle}>{goalData.nombre}</h1>
                    <p className={styles.goalDescription}>{goalData.descripcion || 'Sin descripción.'}</p>
                </div>
                <div className={styles.progressSection}>
                    <h2 className={styles.sectionHeading}>Progreso (cómo se verá con el nuevo valor)</h2>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarHeader}>
                            <span className={styles.progressBarLabel}>Progreso</span>
                            <span className={styles.progressBarPercentage}>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={`${styles.progressBarFill} ${progressPercentage < 33 ? styles.progressFillLow : progressPercentage < 66 ? styles.progressFillMedium : styles.progressFillHigh}`} style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                    <div className={styles.progressDetails}>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Valor (Nuevo)</span><span className={styles.detailValue}>{displayCurrentValue} {goalData.unidad_medida || ''}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>Valor Objetivo</span><span className={styles.detailValue}>{Number(goalData.valor_cuantitativo || 0).toFixed(goalData.unidad_medida?.toLowerCase() === '%' ? 0 : 1)} {goalData.unidad_medida || ''}</span></div>
                    </div>
                    <p className={styles.lastUpdateInfo}>Última actualización del objetivo: <span className={styles.lastUpdateDate}>{lastUpdateDate}</span></p>
                </div>
                <form onSubmit={handleSubmit} className={styles.updateForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newProgressValue" className={styles.formLabel}>Nuevo Valor de Progreso</label>
                        <input type="text" id="newProgressValue" inputMode="decimal" className={styles.formInput} value={newProgressValue} onChange={handleValueChange} placeholder={`Introduce el nuevo valor en ${goalData.unidad_medida || 'unidades'}`} autoFocus />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="notes" className={styles.formLabel}>Notas sobre este Avance (Opcional)</label>
                        <textarea id="notes" className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añade notas sobre este avance..." rows="4"></textarea>
                    </div>
                    {error && goalData && <p className={styles.formErrorMessage}>{error}</p>}
                    <div className={styles.formActions}>
                        <Button type="button" onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary" disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Progreso'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default UpdateProgressPage;