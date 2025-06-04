// frontend/reactapp/src/pages/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react'; // Eliminado useRef si no se usa aquí explícitamente
import styles from './SettingsPage.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormGroup from '../components/ui/FormGroup';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
// import { useNavigate } from 'react-router-dom'; // No se usa navigate directamente en este snippet
import { FaChevronDown, FaChevronUp, FaEye, FaEyeSlash, FaDownload, FaTrash } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

function SettingsPage() {
    const { settings, updateSettings, isLoadingSettings } = useSettings();
    // const navigate = useNavigate(); // Descomentar si se necesita

    // Estado local para los campos del formulario, inicializado desde el contexto.
    // Se actualiza cuando 'settings' del contexto cambia.
    const [localSettingsData, setLocalSettingsData] = useState(settings || {}); 
    
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isProcessingDataAction, setIsProcessingDataAction] = useState(false);
    
    // Errores específicos por sección para mayor claridad
    const [generalSettingsError, setGeneralSettingsError] = useState(null);
    const [passwordFormError, setPasswordFormError] = useState(null);
    const [dataAccountError, setDataAccountError] = useState(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [openSections, setOpenSections] = useState({
        notifications: true,
        appearance: true,
        changePassword: true,
        dataAccount: true,
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    useEffect(() => {
        // Sincronizar localSettingsData cuando settings del contexto cambie
        // Esto asegura que el formulario refleje los datos más recientes del contexto
        // (ej. después de una carga inicial o una actualización externa).
        // Si el usuario tenía cambios locales no guardados, se sobrescribirán.
        // Esto es a menudo el comportamiento esperado para evitar inconsistencias.
        if (settings) {
            setLocalSettingsData(prevData => ({
                ...prevData, // Mantener campos no gestionados por 'settings' si los hubiera
                ...settings // Sobrescribir con los valores del contexto
            }));
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (['currentPassword', 'newPassword', 'confirmNewPassword'].includes(name)) {
            if (name === 'currentPassword') setCurrentPassword(value);
            else if (name === 'newPassword') setNewPassword(value);
            else if (name === 'confirmNewPassword') setConfirmNewPassword(value);
        } else {
            setLocalSettingsData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const toggleSection = (sectionName) => {
        setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    };

    const handleSaveAllSettings = async () => {
        setIsSavingGeneral(true);
        setGeneralSettingsError(null); // Limpiar error de esta sección
        try {
            const payload = { // Solo enviar los campos relevantes para "configuración general"
                emailNotifications: localSettingsData.emailNotifications,
                pushNotifications: localSettingsData.pushNotifications,
                profileVisibility: localSettingsData.profileVisibility,
                showStatistics: localSettingsData.showStatistics,
                allowAnalysis: localSettingsData.allowAnalysis,
                themePreference: localSettingsData.themePreference,
                language: localSettingsData.language,
                dateFormat: localSettingsData.dateFormat,
            };
            await updateSettings(payload); // updateSettings del contexto se encarga de la UI optimista y el API
            toast.success("Configuración general guardada con éxito.");
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error al guardar la configuración general.";
            setGeneralSettingsError(errorMessage); // Mostrar error en la sección relevante o globalmente
            // toast.error ya se maneja en updateSettings del contexto si se relanza el error
        } finally {
            setIsSavingGeneral(false);
        }
    };

    const handleChangePassword = async () => {
        setIsSavingPassword(true);
        setPasswordFormError(null);
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordFormError("Todos los campos de contraseña son obligatorios.");
            toast.error("Por favor, rellena todos los campos de contraseña.");
            setIsSavingPassword(false);
            return;
        }
        if (newPassword.length < 8) { // Ejemplo de validación de fortaleza
             setPasswordFormError("La nueva contraseña debe tener al menos 8 caracteres.");
             toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
             setIsSavingPassword(false);
             return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordFormError("La nueva contraseña y su confirmación no coinciden.");
            toast.error("Las nuevas contraseñas no coinciden.");
            setIsSavingPassword(false);
            return;
        }
        try {
            const passwordPayload = { currentPassword, newPassword };
            await apiService.changePassword(passwordPayload);
            toast.success("Contraseña actualizada con éxito.");
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
            setPasswordFormError(null);
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error al cambiar la contraseña.";
            setPasswordFormError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleExportData = async () => {
        setIsProcessingDataAction(true);
        setDataAccountError(null);
        try {
            const responseData = await apiService.exportUserData();
            const jsonString = JSON.stringify(responseData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = `datos_objectify_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href); // Limpiar ObjectURL
            toast.success("La exportación de tus datos ha comenzado.");
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error al exportar los datos.";
            setDataAccountError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsProcessingDataAction(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("¿Estás ABSOLUTAMENTE seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y borrará todos tus objetivos y datos permanentemente.")) {
            return;
        }
        setIsProcessingDataAction(true);
        setDataAccountError(null);
        try {
            await apiService.deleteAccount();
            toast.success("Tu cuenta ha sido eliminada. Serás redirigido.");
            // El evento 'logoutUser' notificará a AuthContext para limpiar estado y redirigir
            window.dispatchEvent(new CustomEvent('logoutUser', { detail: { reason: 'accountDeleted', notifyBackend: false } }));
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error al eliminar la cuenta.";
            setDataAccountError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsProcessingDataAction(false);
        }
    };

    if (isLoadingSettings) {
        return <div className={styles.centeredStatus}><LoadingSpinner size="large" text="Cargando configuración..." /></div>;
    }

    // El JSX completo seguiría aquí. Para brevedad, se omite la repetición del JSX largo.
    // Asegúrate de mostrar los errores específicos de sección (generalSettingsError, passwordFormError, dataAccountError)
    // dentro de sus respectivas secciones si openSections[sectionName] es true.
    // Ejemplo para el error general (si se mantiene un error global):
    // {generalSettingsError && <p className={`${styles.formErrorMessage} ${styles.globalFormError}`}>{generalSettingsError}</p>}
    
    // Ejemplo de cómo mostrar el error en la sección de contraseña:
    // {openSections.changePassword && passwordFormError && <p className={`${styles.formErrorMessage} ${styles.sectionFormError}`}>{passwordFormError}</p>}
    
    // ... (JSX completo aquí, similar al original pero usando los nuevos estados de error específicos si se implementan)
    // Aquí va el JSX completo de tu componente SettingsPage
    // No lo repito para brevedad, pero asegúrate de que esté aquí, y que los mensajes de error
    // se muestren usando los nuevos estados (generalSettingsError, passwordFormError, dataAccountError)
    // dentro de sus respectivas secciones si están abiertas.
    return (
        <div className={styles.settingsPageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Configuración de la Cuenta</h1>
            </div>

            {/* Mostrar error general si existe y no es específico de una sección abierta con su propio error */}
            {generalSettingsError && 
             !((openSections.changePassword && passwordFormError) || (openSections.dataAccount && dataAccountError)) &&
                <p className={`${styles.formErrorMessage} ${styles.globalFormError}`}>{generalSettingsError}</p>
            }

            {/* Sección de Notificaciones */}
            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('notifications')} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSection('notifications')} aria-expanded={openSections.notifications}>
                    <h2 className={styles.cardTitle}>Notificaciones</h2>
                    {openSections.notifications ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.notifications && (
                    <>
                        <p className={styles.cardSubtitle}>Configura cómo y cuándo quieres recibir notificaciones.</p>
                        <div className={styles.formSection}>
                            <FormGroup>
                                <label className={styles.toggleLabel} htmlFor="emailNotifications-checkbox">
                                    Notificaciones por email
                                    <Input type="checkbox" id="emailNotifications-checkbox" name="emailNotifications" checked={!!localSettingsData.emailNotifications} onChange={handleInputChange} className={styles.toggleInput} />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                                <p className={styles.toggleDescription}>Recibe actualizaciones importantes por correo electrónico.</p>
                            </FormGroup>
                            <FormGroup>
                                <label className={styles.toggleLabel} htmlFor="pushNotifications-checkbox">
                                    Notificaciones push (Navegador)
                                    <Input type="checkbox" id="pushNotifications-checkbox" name="pushNotifications" checked={!!localSettingsData.pushNotifications} onChange={handleInputChange} className={styles.toggleInput} />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                                <p className={styles.toggleDescription}>Permite notificaciones en tiempo real en tu navegador.</p>
                            </FormGroup>
                        </div>
                    </>
                )}
            </section>

            

            {/* Sección de Apariencia */}
            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('appearance')} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSection('appearance')} aria-expanded={openSections.appearance}>
                    <h2 className={styles.cardTitle}>Apariencia</h2>
                    {openSections.appearance ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.appearance && (
                    <>
                        <p className={styles.cardSubtitle}>Personaliza la apariencia de la aplicación.</p>
                        <div className={styles.formSection}>
                            <FormGroup label="Tema:" htmlFor="theme-preference">
                                <Input type="select" id="theme-preference" name="themePreference" value={localSettingsData.themePreference || 'system'} onChange={handleInputChange} >
                                    <option value="light">Claro</option>
                                    <option value="dark">Oscuro</option>
                                    <option value="system">Preferencias del Sistema</option>
                                </Input>
                            </FormGroup>
                            <FormGroup label="Idioma:" htmlFor="language">
                                <Input type="select" id="language" name="language" value={localSettingsData.language || 'es'} onChange={handleInputChange} >
                                    <option value="es">Español</option>
                                    <option value="en">Inglés</option>
                                </Input>
                            </FormGroup>
                            <FormGroup label="Formato de fecha:" htmlFor="date-format">
                                <Input
                                    type="select"
                                    id="date-format"
                                    name="dateFormat"
                                    value={localSettingsData.dateFormat || 'dd/MM/yyyy'}
                                    onChange={handleInputChange}
                                >
                                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                </Input>
                            </FormGroup>
                        </div>
                    </>
                )}
            </section>
            
            {/* Botón Global para Guardar Configuraciones Generales */}
            <div className={styles.globalSaveActions}>
                <Button
                    variant="primary"
                    onClick={handleSaveAllSettings}
                    isLoading={isSavingGeneral}
                    disabled={isSavingGeneral}
                >
                    Guardar Cambios de Configuración
                </Button>
            </div>


            {/* Sección de Cambiar Contraseña */}
            <section className={styles.settingsCard}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('changePassword')} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSection('changePassword')} aria-expanded={openSections.changePassword}>
                    <h2 className={styles.cardTitle}>Cambiar Contraseña</h2>
                    {openSections.changePassword ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.changePassword && (
                    <>
                        <p className={styles.cardSubtitle}>Actualiza tu contraseña para mantener tu cuenta segura.</p>
                        <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                            <div className={styles.formSection}>
                                <FormGroup label="Contraseña actual:" htmlFor="current-password">
                                    <Input type={showCurrentPassword ? "text" : "password"} id="current-password" name="currentPassword" value={currentPassword} onChange={handleInputChange} actionIcon={showCurrentPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowCurrentPassword(!showCurrentPassword)} actionIconAriaLabel={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"} autoComplete="current-password" />
                                </FormGroup>
                                <FormGroup label="Nueva contraseña:" htmlFor="new-password">
                                    <Input type={showNewPassword ? "text" : "password"} id="new-password" name="newPassword" value={newPassword} onChange={handleInputChange} actionIcon={showNewPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowNewPassword(!showNewPassword)} actionIconAriaLabel={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"} autoComplete="new-password" />
                                </FormGroup>
                                <FormGroup label="Confirmar nueva contraseña:" htmlFor="confirm-new-password">
                                    <Input type={showConfirmNewPassword ? "text" : "password"} id="confirm-new-password" name="confirmNewPassword" value={confirmNewPassword} onChange={handleInputChange} actionIcon={showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />} onActionClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} actionIconAriaLabel={showConfirmNewPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"} autoComplete="new-password" />
                                </FormGroup>
                                {passwordFormError && <p className={`${styles.formErrorMessage} ${styles.sectionFormError}`}>{passwordFormError}</p>}
                                <div className={styles.passwordChangeActions}>
                                    <Button type="submit" variant="primary" isLoading={isSavingPassword} disabled={isSavingPassword} > Cambiar Contraseña </Button>
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </section>

            {/* Sección de Datos y Cuenta */}
            <section className={`${styles.settingsCard} ${styles.dangerZone}`}>
                <div className={styles.cardHeaderWithToggle} onClick={() => toggleSection('dataAccount')} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSection('dataAccount')} aria-expanded={openSections.dataAccount}>
                    <h2 className={styles.cardTitle}>Datos y Cuenta</h2>
                    {openSections.dataAccount ? <FaChevronUp className={styles.toggleIconOpen} /> : <FaChevronDown className={styles.toggleIcon} />}
                </div>
                {openSections.dataAccount && (
                    <>
                        <p className={styles.cardSubtitle}>Gestiona tus datos y configuración de cuenta.</p>
                        <div className={styles.formSection}>
                            <FormGroup label="Exportar datos:">
                                <p className={styles.sectionDescription}>Descarga una copia de todos tus datos personales y de objetivos.</p>
                                <div className={styles.inlineAction}>
                                    <Button variant="secondary" onClick={handleExportData} isLoading={isProcessingDataAction} disabled={isProcessingDataAction} leftIcon={<FaDownload />} > Exportar mis datos </Button>
                                </div>
                            </FormGroup>
                            <FormGroup label="Eliminar cuenta:">
                                <p className={styles.sectionDescription}>Esta acción es irreversible y borrará todos tus datos permanentemente.</p>
                                <div className={styles.inlineAction}>
                                    <Button variant="destructive" onClick={handleDeleteAccount} isLoading={isProcessingDataAction} disabled={isProcessingDataAction} leftIcon={<FaTrash />} > Eliminar mi cuenta </Button>
                                </div>
                            </FormGroup>
                            {dataAccountError && <p className={`${styles.formErrorMessage} ${styles.sectionFormError}`}>{dataAccountError}</p>}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

export default SettingsPage;