import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import styles from './SettingsPage.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormGroup from '../components/ui/FormGroup';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { FaChevronDown, FaChevronUp, FaEye, FaEyeSlash, FaDownload, FaTrash } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';

function SettingsPage() {
    const { settings, updateSettings, isLoadingSettings, applyTemporarySettings } = useSettings(); // Assuming applyTemporarySettings exists or you'll add it
    const { t, i18n } = useTranslation();

    // Estado para los datos del formulario (el estado "sucio" o de borrador)
    const [localSettingsData, setLocalSettingsData] = useState(settings || {});
    // Nuevo estado para saber si hay cambios sin guardar
    const [isDirty, setIsDirty] = useState(false);

    // Estados para los diferentes procesos de guardado y errores
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isProcessingDataAction, setIsProcessingDataAction] = useState(false);
    const [passwordFormError, setPasswordFormError] = useState(null);
    const [dataAccountError, setDataAccountError] = useState(null);

    // Estados para el formulario de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Estado para las secciones desplegables
    const [openSections, setOpenSections] = useState({
        notifications: true,
        appearance: true,
        changePassword: true,
        dataAccount: true,
    });

    // Estados para mostrar/ocultar contraseñas
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Sincroniza el estado local cuando los ajustes del contexto cambian (ej. al cargar la página o al revertir)
    useEffect(() => {
        if (settings) {
            setLocalSettingsData(settings);
            // Apply language immediately if it changes from settings (e.g., initial load or revert)
            if (i18n.language !== settings.language) {
                i18n.changeLanguage(settings.language);
            }
            // If you have a global mechanism to apply theme/date format immediately
            // based on the context's 'settings', you would call it here too.
            // For example, if your useSettings context applies these globally:
            // applyTemporarySettings(settings); // Or a specific function for initial load
        }
    }, [settings, i18n]); // Added i18n to dependencies

    // Detecta si hay cambios sin guardar comparando el estado local con el del contexto
    useEffect(() => {
        const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettingsData);
        setIsDirty(hasChanges);
    }, [settings, localSettingsData]);

    // Maneja los cambios en la mayoría de los inputs del formulario
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setLocalSettingsData(prev => {
            const updatedData = { ...prev, [name]: newValue };

            // Apply appearance settings immediately to the UI
            if (name === 'themePreference' || name === 'dateFormat') {
                if (applyTemporarySettings) { // Assuming applyTemporarySettings exists in context
                    applyTemporarySettings({ [name]: newValue });
                } else {
                    // Fallback or direct DOM manipulation if no context function
                    // This is less ideal but would achieve immediate visual change
                    if (name === 'themePreference') {
                        document.documentElement.setAttribute('data-theme', newValue);
                    }
                    // For dateFormat, direct visual change might be harder without re-rendering components
                }
            }
            return updatedData;
        });
    }, [applyTemporarySettings]); // Added applyTemporarySettings to dependencies

    // Maneja el cambio de idioma: actualiza la UI y el estado local, pero no guarda
    const handleLanguageChange = useCallback((e) => {
        const newLang = e.target.value;
        i18n.changeLanguage(newLang); // This changes the UI language immediately
        setLocalSettingsData(prev => ({ ...prev, language: newLang })); // Update local form state
    }, [i18n]); // Added i18n to dependencies

    // Descarta los cambios locales y vuelve al estado guardado
    const handleRevertChanges = useCallback(() => {
        setLocalSettingsData(settings);
        if (i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
        }
        if (applyTemporarySettings) { // Reapply original theme/date format if available
            applyTemporarySettings(settings);
        } else {
             // Fallback for theme:
             document.documentElement.setAttribute('data-theme', settings.themePreference || 'system');
        }
        toast.info(t('toast.changesReverted'));
    }, [settings, i18n, t, applyTemporarySettings]); // Added applyTemporarySettings to dependencies

    // Guarda todos los cambios de configuración general
    const handleSaveAllSettings = useCallback(async () => {
        setIsSaving(true);
        try {
            await updateSettings(localSettingsData); // This calls the API
            toast.success(t('toast.settingsSaveSuccess'));
        } catch (err) {
            // The error toast is already handled by the context or interceptor
        } finally {
            setIsSaving(false);
        }
    }, [localSettingsData, updateSettings, t]); // Added t to dependencies

    const handlePasswordInputChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'currentPassword') setCurrentPassword(value);
        else if (name === 'newPassword') setNewPassword(value);
        else if (name === 'confirmNewPassword') setConfirmNewPassword(value);
    }, []);

    const handleChangePassword = useCallback(async (e) => {
        e.preventDefault();
        setIsSavingPassword(true);
        setPasswordFormError(null);
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            const errorMsg = t('formValidation.allPasswordFieldsRequired');
            setPasswordFormError(errorMsg);
            toast.error(errorMsg);
            setIsSavingPassword(false);
            return;
        }
        if (newPassword.length < 8) {
            const errorMsg = t('formValidation.passwordMinLength', { count: 8 });
            setPasswordFormError(errorMsg);
            toast.error(errorMsg);
            setIsSavingPassword(false);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            const errorMsg = t('formValidation.passwordsDoNotMatch');
            setPasswordFormError(errorMsg);
            toast.error(errorMsg);
            setIsSavingPassword(false);
            return;
        }
        try {
            await apiService.changePassword({ currentPassword, newPassword });
            toast.success(t('toast.passwordUpdated'));
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
            setPasswordFormError(null);
        } catch (err) {
            const errorMessage = err.data?.message || err.message || t('toast.passwordUpdateError');
            setPasswordFormError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSavingPassword(false);
        }
    }, [currentPassword, newPassword, confirmNewPassword, t]); // Added t to dependencies

    const handleExportData = useCallback(async () => {
        setIsProcessingDataAction(true);
        setDataAccountError(null);
        try {
            const responseData = await apiService.exportUserData();
            const jsonString = JSON.stringify(responseData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `datos_goalmaster_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            toast.success(t('toast.exportSuccess'));
        } catch (err) {
            const errorMessage = err.data?.message || err.message || t('toast.exportError');
            setDataAccountError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsProcessingDataAction(false);
        }
    }, [t]);

    const handleDeleteAccount = useCallback(async () => {
        if (!window.confirm(t('settingsPage.data.deleteConfirmation'))) {
            return;
        }
        setIsProcessingDataAction(true);
        setDataAccountError(null);
        try {
            await apiService.deleteAccount();
            toast.success(t('toast.accountDeleted'));
            window.dispatchEvent(new CustomEvent('logoutUser', { detail: { reason: 'accountDeleted', notifyBackend: false } }));
        } catch (err) {
            const errorMessage = err.data?.message || err.message || t('toast.deleteAccountError');
            setDataAccountError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsProcessingDataAction(false);
        }
    }, [t]);

    const toggleSection = useCallback((sectionName) => {
        setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    }, []);

    if (isLoadingSettings) {
        return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingSettings')} /></div>;
    }

    return (
        <div className={styles.settingsPageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{t('settingsPage.accountSettingsTitle')}</h1>
                
            </div>

            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('appearance')} role="button" tabIndex={0}>
                    <h2 className={styles.cardTitle}>{t('settingsPage.appearance.title')}</h2>
                    {openSections.appearance ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.appearance && (
                    <>
                        <p className={styles.cardSubtitle}>{t('settingsPage.appearance.subtitle')}</p>
                        <div className={styles.formSection}>
                            <FormGroup label={t('settingsPage.appearance.themeLabel')} htmlFor="theme-preference">
                                <Input type="select" id="theme-preference" name="themePreference" value={localSettingsData.themePreference || 'system'} onChange={handleInputChange}>
                                    <option value="light">{t('theme.light')}</option>
                                    <option value="dark">{t('theme.dark')}</option>
                                    <option value="system">{t('theme.system')}</option>
                                </Input>
                            </FormGroup>
                            <FormGroup label={t('settingsPage.appearance.languageLabel')} htmlFor="language">
                                <Input type="select" id="language" name="language" value={localSettingsData.language || 'es'} onChange={handleLanguageChange}>
                                    <option value="es">{t('language.es')}</option>
                                    <option value="en">{t('language.en')}</option>
                                </Input>
                            </FormGroup>
                            <FormGroup label={t('settingsPage.appearance.dateFormatLabel')} htmlFor="date-format">
                                <Input type="select" id="date-format" name="dateFormat" value={localSettingsData.dateFormat || 'dd/MM/yyyy'} onChange={handleInputChange}>
                                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                </Input>
                            </FormGroup>
                        </div>
                    </>
                )}
            </section>

            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('changePassword')} role="button" tabIndex={0}>
                    <h2 className={styles.cardTitle}>{t('settingsPage.password.title')}</h2>
                    {openSections.changePassword ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.changePassword && (
                    <>
                        <p className={styles.cardSubtitle}>{t('settingsPage.password.subtitle')}</p>
                        <form onSubmit={handleChangePassword}>
                            <div className={styles.formSection}>
                                <FormGroup label={t('settingsPage.password.currentLabel')} htmlFor="current-password">
                                    <Input type={showCurrentPassword ? "text" : "password"} id="current-password" name="currentPassword" value={currentPassword} onChange={handlePasswordInputChange} actionIcon={showCurrentPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowCurrentPassword(!showCurrentPassword)} actionIconAriaLabel={t(showCurrentPassword ? 'settingsPage.password.toggleAria.hideCurrent' : 'settingsPage.password.toggleAria.showCurrent')} autoComplete="current-password" />
                                </FormGroup>
                                <FormGroup label={t('settingsPage.password.newLabel')} htmlFor="new-password">
                                    <Input type={showNewPassword ? "text" : "password"} id="new-password" name="newPassword" value={newPassword} onChange={handlePasswordInputChange} actionIcon={showNewPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowNewPassword(!showNewPassword)} actionIconAriaLabel={t(showNewPassword ? 'settingsPage.password.toggleAria.hideNew' : 'settingsPage.password.toggleAria.showNew')} autoComplete="new-password" />
                                </FormGroup>
                                <FormGroup label={t('settingsPage.password.confirmLabel')} htmlFor="confirm-new-password">
                                    <Input type={showConfirmNewPassword ? "text" : "password"} id="confirm-new-password" name="confirmNewPassword" value={confirmNewPassword} onChange={handlePasswordInputChange} actionIcon={showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} actionIconAriaLabel={t(showConfirmNewPassword ? 'settingsPage.password.toggleAria.hideConfirm' : 'settingsPage.password.toggleAria.showConfirm')} autoComplete="new-password" />
                                </FormGroup>
                                {passwordFormError && <p className={`${styles.formErrorMessage} ${styles.sectionFormError}`}>{passwordFormError}</p>}
                                <div className={styles.passwordChangeActions}>
                                    <Button type="submit" variant="primary" isLoading={isSavingPassword} disabled={isSavingPassword}>{t('settingsPage.password.changeButton')}</Button>
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </section>

            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('dataAccount')} role="button" tabIndex={0}>
                    <h2 className={styles.cardTitle}>{t('settingsPage.data.title')}</h2>
                    {openSections.dataAccount ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>

                {openSections.dataAccount && (
                    <div className={styles.formSection}>
                        {/* Fila para Exportar Datos */}
                        <div className={styles.actionRow}>
                            <div className={styles.actionDescription}>
                                <strong>{t('settingsPage.data.exportLabel')}</strong>
                                <p>{t('settingsPage.data.exportDescription')}</p>
                            </div>
                            <div className={styles.actionButtonContainer}>
                                <Button variant="secondary" onClick={handleExportData} isLoading={isProcessingDataAction} disabled={isProcessingDataAction} leftIcon={<FaDownload />} >
                                    {t('settingsPage.data.exportButton')}
                                </Button>
                            </div>
                        </div>

                        {/* Fila para Eliminar Cuenta */}
                        <div className={`${styles.actionRow} ${styles.actionRowDestructive}`}>
                            <div className={styles.actionDescription}>
                                <strong>{t('settingsPage.data.deleteLabel')}</strong>
                                <p>{t('settingsPage.data.deleteDescription')}</p>
                            </div>
                            <div className={styles.actionButtonContainer}>
                                <Button variant="destructive" onClick={handleDeleteAccount} isLoading={isProcessingDataAction} disabled={isProcessingDataAction} leftIcon={<FaTrash />} >
                                    {t('settingsPage.data.deleteButton')}
                                </Button>
                            </div>
                        </div>
                        
                        {dataAccountError && <p className={`${styles.formErrorMessage} ${styles.sectionFormError}`}>{dataAccountError}</p>}
                    </div>
                )}
            </section>
            <div>
            {isDirty && (
                    <div className={styles.globalActionsContainer}>  {/* <--- ESTE ES EL CONTENEDOR */}
                        <Button variant="secondary" onClick={handleRevertChanges} disabled={isSaving}>
                            {t('common.revert')}
                        </Button>
                        <Button variant="primary" onClick={handleSaveAllSettings} isLoading={isSaving} disabled={isSaving}>
                            {t('common.saveChanges')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsPage;