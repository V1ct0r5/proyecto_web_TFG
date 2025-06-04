// frontend/reactapp/src/context/SettingsContext.js
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from 'react';
import { useAuth } from './AuthContext'; // Para saber si el usuario está autenticado
import apiService from '../services/apiService'; // Para cargar y guardar configuraciones
import { toast } from 'react-toastify';

const SettingsContext = createContext(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === null) {
        throw new Error("useSettings debe ser usado dentro de un SettingsProvider");
    }
    return context;
};

const defaultSettings = {
    themePreference: 'system', // 'light', 'dark', 'system'
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    showStatistics: true,
    allowAnalysis: true,
    // weeklySummary y objectiveReminders fueron eliminados según tu petición
};

export const SettingsProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isApplyingTheme, setIsApplyingTheme] = useState(true); // Para el efecto inicial del tema

    const applyThemeToDocument = useCallback((themePreference) => {
        const root = document.documentElement;
        let themeToApply = themePreference;

        if (themePreference === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = systemPrefersDark ? 'dark' : 'light';
        }
        
        root.setAttribute('data-theme', themeToApply);
        localStorage.setItem('app-theme', themeToApply); // Guardar el tema resuelto
        // console.log(`SettingsContext: Tema aplicado y guardado en localStorage: ${themeToApply}`);
    }, []);

    const loadUserSettings = useCallback(async () => {
        if (isAuthenticated && user?.id) {
            setIsLoadingSettings(true);
            try {
                const response = await apiService.getUserSettings();
                if (response && response.preferences) {
                    // Fusionar con defaults para asegurar que todos los campos existan
                    const mergedSettings = { ...defaultSettings, ...response.preferences };
                    setSettings(mergedSettings);
                    applyThemeToDocument(mergedSettings.themePreference);
                } else {
                    setSettings(defaultSettings);
                    applyThemeToDocument(defaultSettings.themePreference);
                }
            } catch (error) {
                console.error("SettingsContext: Error al cargar la configuración del usuario:", error);
                toast.error("No se pudo cargar tu configuración guardada. Se usarán los valores por defecto.");
                setSettings(defaultSettings);
                applyThemeToDocument(defaultSettings.themePreference); // Aplicar tema por defecto en caso de error
            } finally {
                setIsLoadingSettings(false);
                setIsApplyingTheme(false);
            }
        } else if (!isAuthenticated) {
            // Usuario NO autenticado o cerrando sesión
            setSettings(defaultSettings); // Resetear a los defaults del código
            applyThemeToDocument('light'); // Forzar tema claro para páginas de login/registro
            setIsLoadingSettings(false);
            setIsApplyingTheme(false);
        }
    }, [isAuthenticated, user, applyThemeToDocument]);

    // Efecto para cargar el tema desde localStorage al inicio de la aplicación (antes de Auth y Settings)
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
        // Pequeño delay para el primer renderizado del tema, luego loadUserSettings puede tomar el control
        const timer = setTimeout(() => setIsApplyingTheme(false), 50); 
        return () => clearTimeout(timer);
    }, []);

    // Cargar configuración del usuario cuando el estado de autenticación cambie
    useEffect(() => {
        loadUserSettings();
    }, [loadUserSettings]); // Se ejecuta cuando isAuthenticated o user cambian gracias a la dependencia en useCallback

    const updateSettings = useCallback(async (settingsToUpdate) => {
        if (!isAuthenticated) {
            toast.error("Debes iniciar sesión para guardar la configuración.");
            throw new Error("Usuario no autenticado");
        }
        try {
            const currentSettingsWithPayload = { ...settings, ...settingsToUpdate };
            setSettings(currentSettingsWithPayload); // Actualización optimista para la UI
            applyThemeToDocument(currentSettingsWithPayload.themePreference); // Aplicar tema inmediatamente

            await apiService.updateUserSettings(settingsToUpdate); // Enviar solo los cambios al backend

            // Opcional: Recargar desde el backend para asegurar consistencia total,
            // o confiar en que la respuesta del API (si la hubiera) confirme los datos.
            // loadUserSettings(); // Esto podría causar un parpadeo si el API tarda.
            return true;
        } catch (error) {
            console.error("SettingsContext: Error al guardar la configuración:", error);
            toast.error(error.message || "Error al guardar la configuración. Por favor, inténtalo de nuevo.");
            // Revertir al estado anterior si el guardado falla
            loadUserSettings(); // Recargar las configuraciones desde el servidor para revertir el cambio optimista
            throw error;
        }
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