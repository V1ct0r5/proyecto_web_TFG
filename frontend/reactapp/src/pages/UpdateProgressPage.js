import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './UpdateProgressPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { format, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

function UpdateProgressPage() {
    const { id: objectiveId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchGoalDetails = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await api.getObjectiveById(objectiveId);
            const objectiveData = response?.data?.objective;
            if (!objectiveData) {
                throw new Error('Objetivo no encontrado.');
            }
            setGoalData(objectiveData);
        } catch (err) {
            setError(err.message || t('errors.objectiveLoadError'));
            toast.error(err.message || t('toast.objectiveLoadDetailsError'));
        } finally { setLoading(false); }
    }, [objectiveId, t]);

    useEffect(() => {
        if (objectiveId) fetchGoalDetails();
    }, [objectiveId, fetchGoalDetails]);
    
    if (loading) return (<div className={styles.updateProgressPage}><LoadingSpinner size='large' text={t('loaders.loadingObjectiveForEdit')}/></div>);
    if (error && !goalData) return (<div className={`${styles.updateProgressPage} ${styles.updateProgressPageError}`}><p>{error}</p><Button onClick={() => navigate('/')}>{t('common.backToDashboard')}</Button></div>);
    if (!goalData) return (<div className={styles.updateProgressPage}><p>{t('errors.objectiveNotFound')}</p><Button onClick={() => navigate('/')}>{t('common.backToDashboard')}</Button></div>);
    
    if (goalData.status === 'ARCHIVED') {
        return ( 
            <div className={styles.updateProgressPage}>
                <div className={styles.nonQuantitativeMessage}>
                    <h2 className={styles.nonQuantitativeMessageTitle}>{t('updateProgressPage.titleArchived', { name: goalData.name })}</h2>
                    <p className={styles.nonQuantitativeMessageText}>{t('updateProgressPage.archivedError')}</p>
                    <div className={styles.nonQuantitativeMessageActions}>
                        <Button onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary">{t('updateProgressPage.backToObjective')}</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (goalData.targetValue === null || isNaN(Number(goalData.targetValue))) {
        return ( 
            <div className={styles.updateProgressPage}>
                <div className={`${styles.nonQuantitativeMessage}`}>
                    <h2 className={styles.nonQuantitativeMessageTitle}>{t('updateProgressPage.title', { name: goalData.name })}</h2>
                    <p className={styles.nonQuantitativeMessageText}>{t('updateProgressPage.notQuantitative')}</p>
                    <p className={styles.nonQuantitativeMessageText}>{t('updateProgressPage.notQuantitativeSuggestion')}</p>
                    <div className={styles.nonQuantitativeMessageActions}>
                        <Button onClick={() => navigate(`/objectives/${objectiveId}`)} variant="secondary">{t('updateProgressPage.backToObjective')}</Button>
                        <Button onClick={() => navigate(`/objectives/edit/${objectiveId}`)}>{t('common.edit')}</Button>
                    </div>
                </div>
            </div>
        );
    }

    return <QuantitativeUpdateForm goalData={goalData} />;
}


function QuantitativeUpdateForm({ goalData }) {
    const { id: objectiveId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [newProgressValue, setNewProgressValue] = useState(() => (goalData.currentValue != null) ? String(goalData.currentValue) : (goalData.initialValue != null) ? String(goalData.initialValue) : '');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const dateLocale = i18n.language === 'es' ? es : enUS;

    const determineNewStatusLogic = (currentValueNum, targetValueNum, initialValueNum, currentStatus, isLowerBetter) => {
        if (isNaN(currentValueNum) || isNaN(targetValueNum) || isNaN(initialValueNum)) {
            return currentStatus;
        }
        let newStatus = currentStatus;
        if (isLowerBetter ? (currentValueNum <= targetValueNum) : (currentValueNum >= targetValueNum)) {
            newStatus = 'COMPLETED';
        } else if (currentStatus === 'PENDING' || currentStatus === 'COMPLETED') {
            newStatus = 'IN_PROGRESS';
        }
        return newStatus;
    };

    const handleValueChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === '') setNewProgressValue(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        if (newProgressValue.trim() === '') { toast.error(t('toast.progressUpdate.valueRequiredError')); setIsSubmitting(false); return; }
        
        const valueToUpdate = parseFloat(newProgressValue);
        if (isNaN(valueToUpdate)) { toast.error(t('toast.progressUpdate.invalidValueError')); setIsSubmitting(false); return; }

        const calculatedNewStatus = determineNewStatusLogic(valueToUpdate, Number(goalData.targetValue), Number(goalData.initialValue), goalData.status, goalData.isLowerBetter);
        const payload = { status: calculatedNewStatus, progressData: { value: valueToUpdate, notes: notes.trim() === '' ? null : notes.trim() } };

        try {
            await api.updateObjective(objectiveId, payload);
            toast.success(t('toast.progressUpdate.success'));
            navigate(`/objectives/${objectiveId}`);
        } catch (err) {
            const errorMessage = err.message || t('toast.progressUpdate.unknownUpdateError');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally { setIsSubmitting(false); }
    };

    const progressPercentage = useMemo(() => {
        const initial = Number(goalData.initialValue || 0);
        const target = Number(goalData.targetValue);
        const isLower = goalData.isLowerBetter;
        const current = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue)) ? parseFloat(newProgressValue) : Number(goalData.currentValue ?? initial);
        if (isNaN(initial) || isNaN(current) || isNaN(target)) return 0;
        if (initial === target) return (isLower ? current <= target : current >= target) ? 100 : 0;
        let prog = isLower ? ((initial - current) / (initial - target)) * 100 : ((current - initial) / (target - initial)) * 100;
        return Math.max(0, Math.min(100, prog));
    }, [goalData, newProgressValue]);

    const lastUpdateDate = useMemo(() => {
        const dateStr = goalData?.updatedAt || goalData?.createdAt;
        if (dateStr && isValid(parseISO(dateStr))) return format(parseISO(dateStr), 'd/M/yyyy HH:mm', { locale: dateLocale });
        return t('common.notAvailable');
    }, [goalData, dateLocale]);

    const displayCurrentValue = useMemo(() => {
        let valueToShow = newProgressValue !== '' && !isNaN(parseFloat(newProgressValue)) ? parseFloat(newProgressValue) : Number(goalData.currentValue ?? goalData.initialValue ?? 0);
        return valueToShow.toFixed(1);
    }, [newProgressValue, goalData]);
    
    return (
        <div className={styles.updateProgressPage}>
            <div className={styles.updateProgressCard}>
                <div className={styles.updateProgressHeader}>
                    <h1 className={styles.goalTitle}>{goalData.name}</h1>
                    <p className={styles.goalDescription}>{goalData.description || t('common.noDescription')}</p>
                </div>
                <div className={styles.progressSection}>
                    <h2 className={styles.sectionHeading}>{t('updateProgressPage.progressPreviewTitle')}</h2>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarHeader}><span className={styles.progressBarLabel}>{t('updateProgressPage.progressLabel')}</span><span className={styles.progressBarPercentage}>{Math.round(progressPercentage)}%</span></div>
                        <div className={styles.progressBar}><div className={`${styles.progressBarFill} ${progressPercentage < 33 ? styles.progressFillLow : progressPercentage < 66 ? styles.progressFillMedium : styles.progressFillHigh}`} style={{ width: `${progressPercentage}%` }}></div></div>
                    </div>
                    <div className={styles.progressDetails}>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>{t('updateProgressPage.newValueLabel')}</span><span className={styles.detailValue}>{displayCurrentValue} {goalData.unit || ''}</span></div>
                        <div className={styles.detailItem}><span className={styles.detailLabel}>{t('updateProgressPage.targetValueLabel')}</span><span className={styles.detailValue}>{Number(goalData.targetValue || 0).toFixed(1)} {goalData.unit || ''}</span></div>
                    </div>
                    <p className={styles.lastUpdateInfo}>{t('updateProgressPage.lastUpdateInfo')}<span className={styles.lastUpdateDate}>{lastUpdateDate}</span></p>
                </div>
                <form onSubmit={handleSubmit} className={styles.updateForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newProgressValue" className={styles.formLabel}>{t('updateProgressPage.newProgressValueLabel')}</label>
                        <input type="text" id="newProgressValue" inputMode="decimal" className={styles.formInput} value={newProgressValue} onChange={handleValueChange} placeholder={t('updateProgressPage.newProgressValuePlaceholder', { unit: goalData.unit || 'unidades' })} autoFocus />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="notes" className={styles.formLabel}>{t('updateProgressPage.notesLabel')}</label>
                        <textarea id="notes" className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('updateProgressPage.notesPlaceholder')} rows="4"></textarea>
                    </div>
                    {error && <p className={styles.formErrorMessage}>{error}</p>}
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