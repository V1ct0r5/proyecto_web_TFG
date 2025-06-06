import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './UpdateProgressPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { format, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const determineNewStatusLogic = (currentValueNum, targetValueStr, initialValueStr, currentStatus, isLowerBetter, tipoObjetivo) => {
    const numericTarget = Number(targetValueStr);
    const numericInitial = Number(initialValueStr);
    const isEffectivelyQuantitative = !isNaN(numericInitial) && !isNaN(numericTarget);

    if (!isEffectivelyQuantitative || isNaN(currentValueNum)) return currentStatus;

    let newCalculatedStatus = currentStatus;
    if (isLowerBetter ? (currentValueNum <= numericTarget) : (currentValueNum >= numericTarget)) {
        newCalculatedStatus = 'Completado';
    } else if (currentStatus === 'Pendiente' && currentValueNum !== numericInitial) {
        newCalculatedStatus = 'En progreso';
    } else if (currentStatus === 'Completado') {
        newCalculatedStatus = 'En progreso';
    }
    return newCalculatedStatus;
};

function UpdateProgressPage() {
    const { id: objectiveId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProgressValue, setNewProgressValue] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dateFnsLocales = { es: es, en: enUS };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;

    const fetchGoalDetails = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await apiService.getObjectiveById(objectiveId);
            setGoalData(data);
            const initialDisplayValue = (data.valor_actual != null) ? String(data.valor_actual) : (data.valor_inicial_numerico != null) ? String(data.valor_inicial_numerico) : '';
            setNewProgressValue(initialDisplayValue);
        } catch (err) {
            setError(t('errors.objectiveLoadError'));
            toast.error(t('toast.objectiveLoadDetailsError'));
        } finally { setLoading(false); }
    }, [objectiveId, t]);

    useEffect(() => { if (objectiveId) fetchGoalDetails(); }, [objectiveId, fetchGoalDetails]);

    const handleValueChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === '') setNewProgressValue(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        if (!goalData) { toast.error(t('toast.progressUpdate.noDataLoadedError')); setIsSubmitting(false); return; }
        if (newProgressValue.trim() === '') { toast.error(t('toast.progressUpdate.valueRequiredError')); setIsSubmitting(false); return; }
        const valueToUpdate = parseFloat(newProgressValue);
        if (isNaN(valueToUpdate)) { toast.error(t('toast.progressUpdate.invalidValueError')); setIsSubmitting(false); return; }

        const calculatedNewStatus = determineNewStatusLogic(valueToUpdate, goalData.valor_cuantitativo, goalData.valor_inicial_numerico, goalData.estado, goalData.es_menor_mejor, goalData.tipo_objetivo);
        const payload = { estado: calculatedNewStatus, progressData: { valor_actual: valueToUpdate, comentarios: notes.trim() === '' ? null : notes.trim() } };

        try {
            await apiService.updateObjective(objectiveId, payload);
            toast.success(t('toast.progressUpdate.success'));
            navigate(`/objectives/${objectiveId}`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || t('toast.progressUpdate.unknownUpdateError');
            setError(`${t('toast.objectiveCreateErrorPrefix')} ${errorMessage}`);
            toast.error(`${t('toast.objectiveCreateErrorPrefix')} ${errorMessage}`);
        } finally { setIsSubmitting(false); }
    };
    
    const progressPercentage = useMemo(() => {
        if (!goalData) return 0;
        const initial = Number(goalData.valor_inicial_numerico || 0);
        const target = Number(goalData.valor_cuantitativo);
        if (isNaN(target)) return 0;
        const isLower = goalData.es_menor_mejor;
        const current = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue)) ? parseFloat(newProgressValue) : Number(goalData.valor_actual ?? initial);
        if (isNaN(initial) || isNaN(current)) return 0;
        if (initial === target) return (isLower ? current <= target : current >= target) ? 100 : 0;
        let prog = isLower ? ((initial - current) / (initial - target)) * 100 : ((current - initial) / (target - initial)) * 100;
        return Math.max(0, Math.min(100, prog));
    }, [goalData, newProgressValue]);

    const lastUpdateDate = useMemo(() => {
        const dateStr = goalData?.updatedAt || goalData?.createdAt;
        if (dateStr && isValid(parseISO(dateStr))) return format(parseISO(dateStr), 'd/M/yyyy HH:mm', { locale: currentLocale });
        return t('common.notAvailable');
    }, [goalData, currentLocale]);

    const displayCurrentValue = useMemo(() => {
        if (!goalData) return '0.0';
        let valueToShow = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue)) ? parseFloat(newProgressValue) : Number(goalData.valor_actual ?? goalData.valor_inicial_numerico ?? 0);
        return valueToShow.toFixed(1);
    }, [newProgressValue, goalData]);
    
    if (loading) return (<div className={styles.updateProgressPage}><LoadingSpinner size='large' text={t('loaders.loadingObjectiveForEdit')}/></div>);
    if (error && !goalData) return (<div className={`${styles.updateProgressPage} ${styles.updateProgressPageError}`}><p>{error}</p><Button onClick={() => navigate('/')}>{t('common.backToDashboard')}</Button></div>);
    if (!goalData) return (<div className={styles.updateProgressPage}><p>{t('errors.objectiveNotFound')}</p><Button onClick={() => navigate('/')}>{t('common.backToDashboard')}</Button></div>);

    const isQuantitative = goalData.valor_cuantitativo != null && !isNaN(Number(goalData.valor_cuantitativo));

    if (!isQuantitative) return ( <div className={`${styles.updateProgressPage} ${styles.nonQuantitativeMessage}`}><h2 className={styles.nonQuantitativeMessageTitle}>{t('updateProgressPage.title', { name: goalData.nombre })}</h2><p className={styles.nonQuantitativeMessageText}>{t('updateProgressPage.notQuantitative')}</p><p className={styles.nonQuantitativeMessageText}>{t('updateProgressPage.notQuantitativeSuggestion')}</p><div className={styles.nonQuantitativeMessageActions}><Button onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary">{t('updateProgressPage.backToObjective')}</Button><Button onClick={() => navigate(`/objectives/edit/${objectiveId}`)}>{t('common.edit')}</Button></div></div>);

    return (
        <div className={styles.updateProgressPage}>
            <div className={styles.updateProgressCard}>
                <div className={styles.updateProgressHeader}>
                    <h1 className={styles.goalTitle}>{goalData.nombre}</h1>
                    <p className={styles.goalDescription}>{goalData.descripcion || t('common.noDescription')}</p>
                </div>
                <div className={styles.progressSection}>
                    <h2 className={styles.sectionHeading}>{t('updateProgressPage.progressPreviewTitle')}</h2>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarHeader}><span className={styles.progressBarLabel}>{t('updateProgressPage.progressLabel')}</span><span className={styles.progressBarPercentage}>{Math.round(progressPercentage)}%</span></div>
                        <div className={styles.progressBar}><div className={`${styles.progressBarFill} ${progressPercentage < 33 ? styles.progressFillLow : progressPercentage < 66 ? styles.progressFillMedium : styles.progressFillHigh}`} style={{ width: `${progressPercentage}%` }}></div></div>
                    </div>
                    <div className={styles.progressDetails}>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>{t('updateProgressPage.newValueLabel')}</span><span className={styles.detailValue}>{displayCurrentValue} {goalData.unidad_medida || ''}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>{t('updateProgressPage.targetValueLabel')}</span><span className={styles.detailValue}>{Number(goalData.valor_cuantitativo || 0).toFixed(goalData.unidad_medida?.toLowerCase() === '%' ? 0 : 1)} {goalData.unidad_medida || ''}</span></div>
                    </div>
                    <p className={styles.lastUpdateInfo}>{t('updateProgressPage.lastUpdateInfo')}<span className={styles.lastUpdateDate}>{lastUpdateDate}</span></p>
                </div>
                <form onSubmit={handleSubmit} className={styles.updateForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newProgressValue" className={styles.formLabel}>{t('updateProgressPage.newProgressValueLabel')}</label>
                        <input type="text" id="newProgressValue" inputMode="decimal" className={styles.formInput} value={newProgressValue} onChange={handleValueChange} placeholder={t('updateProgressPage.newProgressValuePlaceholder', { unit: goalData.unidad_medida || 'unidades' })} autoFocus />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="notes" className={styles.formLabel}>{t('updateProgressPage.notesLabel')}</label>
                        <textarea id="notes" className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('updateProgressPage.notesPlaceholder')} rows="4"></textarea>
                    </div>
                    {error && goalData && <p className={styles.formErrorMessage}>{error}</p>}
                    <div className={styles.formActions}>
                        <Button type="button" onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary" disabled={isSubmitting}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('common.saving') : t('updateProgressPage.saveButton')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateProgressPage;