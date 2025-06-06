import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import i18n from '../i18n'; // Importamos la instancia de i18n directamente

const SettingsContext = createContext(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === null) {
        throw new Error(i18n.t('devErrors.useSettingsMissingProvider'));
    }
    return context;
};

const defaultSettings = {
    themePreference: 'system',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    showStatistics: true,
    allowAnalysis: true,
};

export const SettingsProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isApplyingTheme, setIsApplyingTheme] = useState(true);

    const applyThemeToDocument = useCallback((themePreference) => {
        const root = document.documentElement;
        let themeToApply = themePreference;

        if (themePreference === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = systemPrefersDark ? 'dark' : 'light';
        }
        
        root.setAttribute('data-theme', themeToApply);
        localStorage.setItem('app-theme', themeToApply);
    }, []);

    const loadUserSettings = useCallback(async () => {
        if (isAuthenticated && user?.id) {
            setIsLoadingSettings(true);
            try {
                const response = await apiService.getUserSettings();
                const mergedSettings = { ...defaultSettings, ...(response?.preferences || {}) };
                setSettings(mergedSettings);
                applyThemeToDocument(mergedSettings.themePreference);
                if (i18n.language !== mergedSettings.language) {
                    await i18n.changeLanguage(mergedSettings.language);
                }
            } catch (error) {
                console.error("SettingsContext: Error al cargar la configuración del usuario:", error);
                toast.error(i18n.t('toast.settingsLoadError')); // Usamos i18n.t()
                setSettings(defaultSettings);
                applyThemeToDocument(defaultSettings.themePreference);
            } finally {
                setIsLoadingSettings(false);
                setIsApplyingTheme(false);
            }
        } else if (!isAuthenticated) {
            setSettings(defaultSettings);
            applyThemeToDocument('light');
            if (i18n.language !== defaultSettings.language) {
                await i18n.changeLanguage(defaultSettings.language);
            }
            setIsLoadingSettings(false);
            setIsApplyingTheme(false);
        }
    // CORRECCIÓN: Se eliminan 'i18n' y 't' de las dependencias.
    }, [isAuthenticated, user, applyThemeToDocument]);

    // Este useEffect no necesita cambios
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme');
        const root = document.documentElement;
        setIsApplyingTheme(true);
        if (savedTheme) {
            root.setAttribute('data-theme', savedTheme);
        } else {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
        }
        const timer = setTimeout(() => setIsApplyingTheme(false), 50); 
        return () => clearTimeout(timer);
    }, []);

    // Este useEffect ahora es estable y solo se ejecuta cuando cambia el usuario
    useEffect(() => {
        loadUserSettings();
    }, [loadUserSettings]);

    const updateSettings = useCallback(async (settingsToUpdate) => {
        if (!isAuthenticated) {
            toast.error(i18n.t('toast.loginRequiredForSettings'));
            throw new Error(i18n.t('errors.notAuthenticated'));
        }
        try {
            const currentSettingsWithPayload = { ...settings, ...settingsToUpdate };
            setSettings(currentSettingsWithPayload);
            applyThemeToDocument(currentSettingsWithPayload.themePreference);

            await apiService.updateUserSettings(settingsToUpdate);
            return true;
        } catch (error) {
            console.error("SettingsContext: Error al guardar la configuración:", error);
            toast.error(error.message || i18n.t('toast.settingsSaveError'));
            loadUserSettings();
            throw error;
        }
    // CORRECCIÓN: Se elimina 't' de las dependencias. loadUserSettings ahora es estable.
    }, [isAuthenticated, settings, loadUserSettings, applyThemeToDocument]);

    const contextValue = useMemo(() => ({
        settings,
        isLoadingSettings,
        updateSettings,
        isApplyingTheme
    }), [settings, isLoadingSettings, updateSettings, isApplyingTheme]);

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};