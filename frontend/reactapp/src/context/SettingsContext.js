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
    dateFormat: 'dd/MM/yyyy', // Asegúrate que este formato sea compatible con tu dateUtils
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public', // 'public', 'private', 'friends' (ejemplos)
    showStatistics: true,
    allowAnalysis: true,
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
    }, []);

    const loadUserSettings = useCallback(async () => {
        if (isAuthenticated && user?.id) {
            setIsLoadingSettings(true);
            setIsApplyingTheme(true); // Indicar que estamos intentando aplicar un tema basado en configuración cargada
            try {
                const response = await apiService.getUserSettings();
                if (response && response.preferences) {
                    const mergedSettings = { ...defaultSettings, ...response.preferences };
                    setSettings(mergedSettings);
                    applyThemeToDocument(mergedSettings.themePreference);
                } else {
                    // Si no hay preferencias guardadas, usar los defaults y aplicar el tema por defecto
                    setSettings(defaultSettings);
                    applyThemeToDocument(defaultSettings.themePreference);
                }
            } catch (error) {
                console.error("SettingsContext: Error al cargar la configuración del usuario:", error);
                toast.error("No se pudo cargar tu configuración. Se usarán los valores por defecto.");
                setSettings(defaultSettings);
                applyThemeToDocument(defaultSettings.themePreference);
            } finally {
                setIsLoadingSettings(false);
                setIsApplyingTheme(false);
            }
        } else if (!isAuthenticated) {
            // Usuario NO autenticado o cerrando sesión
            setIsLoadingSettings(true); // Puede haber un breve momento de "carga" para aplicar tema por defecto
            setIsApplyingTheme(true);
            
            setSettings(defaultSettings); // Resetear a los defaults del código
            // Para páginas de login/registro, podrías optar por un tema fijo (ej. 'light')
            // o respetar el último tema conocido/del sistema si no hay uno fijo.
            // La implementación actual (useEffect inicial) ya maneja el localStorage/system pref.
            // Aquí, si forzamos 'light', se podría hacer, pero el useEffect inicial ya puso algo.
            // Tal vez aplicar el tema por defecto de 'defaultSettings' si el usuario cierra sesión.
            const themeForUnauthenticated = defaultSettings.themePreference; // O 'light' directamente si se prefiere
            applyThemeToDocument(themeForUnauthenticated);
            
            setIsLoadingSettings(false);
            setIsApplyingTheme(false);
        }
    }, [isAuthenticated, user, applyThemeToDocument]);

    // Efecto para aplicar el tema guardado en localStorage O el del sistema ANTES de que AuthContext cargue
    useEffect(() => {
        const root = document.documentElement;
        const savedTheme = localStorage.getItem('app-theme');
        let initialThemeToApply = 'light'; // Fallback muy genérico

        if (savedTheme) {
            initialThemeToApply = savedTheme;
        } else { // Si no hay tema guardado, usar el de defaultSettings o el del sistema
            if (defaultSettings.themePreference === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                initialThemeToApply = systemPrefersDark ? 'dark' : 'light';
            } else {
                initialThemeToApply = defaultSettings.themePreference; // ej. 'light' o 'dark' si está en defaults
            }
        }
        root.setAttribute('data-theme', initialThemeToApply);
        localStorage.setItem('app-theme', initialThemeToApply); // Guardar el tema resuelto inicial
        
        // No es estrictamente necesario setIsApplyingTheme aquí si App.js tiene su propio loader inicial
        // pero si se usa para coordinar, está bien.
        // El setTimeout ayuda a que el DOM se actualice antes de quitar el loader en App.js
        const timer = setTimeout(() => setIsApplyingTheme(false), 50);
        return () => clearTimeout(timer);
    }, []); // Solo se ejecuta una vez al montar el Provider

    // Cargar configuración del usuario cuando el estado de autenticación cambie o el usuario cambie.
    useEffect(() => {
        loadUserSettings();
    }, [loadUserSettings]); // la dependencia en loadUserSettings es correcta.

    const updateSettings = useCallback(async (settingsToUpdate) => {
        if (!isAuthenticated) {
            toast.error("Debes iniciar sesión para guardar la configuración.");
            throw new Error("Usuario no autenticado");
        }
        
        // Guardar el estado actual para posible reversión
        const previousSettings = { ...settings }; 

        try {
            const newSettings = { ...settings, ...settingsToUpdate };
            setSettings(newSettings); // Actualización optimista para la UI
            applyThemeToDocument(newSettings.themePreference); // Aplicar tema inmediatamente

            await apiService.updateUserSettings(settingsToUpdate); // Enviar solo los cambios al backend
            
            // Opcional: si el backend devuelve el objeto de configuración completo y actualizado, usarlo:
            // const savedSettingsFromBackend = await apiService.updateUserSettings(settingsToUpdate);
            // if (savedSettingsFromBackend) {
            //     const fullyMerged = { ...defaultSettings, ...savedSettingsFromBackend.preferences };
            //     setSettings(fullyMerged);
            //     applyThemeToDocument(fullyMerged.themePreference);
            // }
            toast.success("Configuración guardada con éxito.");
            return true;
        } catch (error) {
            console.error("SettingsContext: Error al guardar la configuración:", error);
            toast.error(error.response?.data?.message || error.message || "Error al guardar la configuración.");
            
            // Revertir al estado anterior si el guardado falla
            setSettings(previousSettings);
            applyThemeToDocument(previousSettings.themePreference);
            // Opcionalmente, en lugar de revertir al estado optimista anterior, recargar desde el servidor:
            // await loadUserSettings(); // Esto asegura la consistencia con el servidor pero puede ser más lento
            
            throw error;
        }
    }, [isAuthenticated, settings, applyThemeToDocument /*, loadUserSettings si se usa para revertir */]);

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