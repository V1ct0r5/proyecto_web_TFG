// frontend/reactapp/src/services/apiService.js
import axios from "axios";
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const apiService = axios.create({
    baseURL: API_BASE_URL,
    // Content-Type se maneja automáticamente por Axios para JSON y FormData
});

// Función para crear el evento de logout con detalles
const createLogoutEvent = (details) => new CustomEvent('logoutUser', { detail: details });

let logoutProcessInitiated = false;

// Interceptor de Solicitud: Adjunta el token a las peticiones autenticadas
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && config.url !== '/auth/login' && config.url !== '/auth/register') {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Error en configuración de petición Axios:", error); // Útil para depuración
        return Promise.reject(error);
    }
);

// Interceptor de Respuesta: Manejo centralizado de errores y expiración de sesión
apiService.interceptors.response.use(
    response => response, 
    async error => {
        const originalRequest = error.config;
        const isLoginAttempt = originalRequest.url === '/auth/login';

        if (error.response) { 
            const { status, data } = error.response;

            if ((status === 401 || status === 403) && !isLoginAttempt && !originalRequest._retry) {
                originalRequest._retry = true; 
                
                if (!logoutProcessInitiated) {
                    logoutProcessInitiated = true;
                    toast.error('Tu sesión ha expirado o el acceso ha sido denegado. Por favor, inicia sesión de nuevo.', {
                        position: "top-center", autoClose: 4000, /* ...otras opciones de toast... */
                    });
                    
                    window.dispatchEvent(createLogoutEvent({ reason: 'apiAuthError', notifyBackend: false }));
                    
                    setTimeout(() => { logoutProcessInitiated = false; }, 5000);
                }
                return Promise.reject(new Error(data?.message || error.message || 'Error de Autenticación: Sesión expirada o token inválido'));
            }

            const errorMessage = data?.message || 
                                 (data?.errors && Array.isArray(data.errors) ? data.errors.map(e => e.msg || e.message).join(', ') : null) || 
                                 error.message || 
                                 'Ocurrió un error en la respuesta del servidor.';
            
            const errorToThrow = new Error(errorMessage);
            errorToThrow.data = data; 
            errorToThrow.status = status; 
            return Promise.reject(errorToThrow);

        } else if (error.request) {
            toast.error('Error de red. Por favor, verifica tu conexión e inténtalo de nuevo.', { position: "top-center" });
            return Promise.reject(new Error('Error de red. No se pudo conectar con el servidor.'));
        } else {
            toast.error('Error al configurar la petición al servidor.', { position: "top-center" });
            return Promise.reject(new Error(`Error en la configuración de la petición: ${error.message}`));
        }
    }
);

// Definición de todas las funciones del API
// (Las funciones individuales ya no necesitan try/catch { throw error; }
// si el objetivo es solo relanzar, ya que el interceptor o el async/await lo manejan)
const api = {
    // --- Autenticación ---
    register: async (userData) => {
        const response = await apiService.post('/auth/register', userData);
        return response.data;
    },
    login: async (credentials) => {
        const response = await apiService.post('/auth/login', credentials);
        return response.data;
    },
    logout: async () => {
        try {
            const response = await apiService.delete('/auth/logout');
            return response.data;
        } catch (error) {
            console.warn("apiService: Falló la llamada al endpoint /auth/logout del backend, pero se procederá con logout local.", error.message);
            throw error; 
        }
    },

    // --- Objetivos ---
    getObjectives: async () => {
        const response = await apiService.get('/objectives');
        return response.data;
    },
    getObjectiveById: async (objectiveId) => {
        const response = await apiService.get(`/objectives/${objectiveId}`);
        return response.data;
    },
    createObjective: async (objectiveData) => {
        const response = await apiService.post('/objectives', objectiveData);
        return response.data;
    },
    updateObjective: async (objectiveId, dataToUpdate) => {
        const response = await apiService.put(`/objectives/${objectiveId}`, dataToUpdate);
        return response.data;
    },
    deleteObjective: async (objectiveId) => {
        const response = await apiService.delete(`/objectives/${objectiveId}`);
        return response.data;
    },

    // --- Dashboard ---
    getDashboardSummaryStats: async () => {
        const response = await apiService.get('/dashboard/summary-stats');
        return response.data;
    },
    getDashboardRecentObjectives: async (limit = 4) => {
        const response = await apiService.get(`/dashboard/recent-objectives?limit=${limit}`);
        return response.data;
    },
    getDashboardRecentActivities: async (limit = 5) => {
        const response = await apiService.get(`/dashboard/recent-activities?limit=${limit}`);
        return response.data;
    },

    // --- Análisis ---
    getAnalysisSummary: async (params) => {
        const response = await apiService.get('/analysis/summary', { params });
        return response.data;
    },
    // ... (resto de funciones de análisis) ...
    getCategoryDistribution: async (params) => { /* ... */ const response = await apiService.get('/analysis/distribution/category', { params }); return response.data; },
    getObjectiveStatusDistribution: async (params) => { /* ... */ const response = await apiService.get('/analysis/distribution/status', { params }); return response.data; },
    getMonthlyProgress: async (params) => { /* ... */ const response = await apiService.get('/analysis/progress/monthly', { params }); return response.data; },
    getObjectivesProgressChartData: async (params) => { /* ... */ const response = await apiService.get('/analysis/objectives-progress', { params }); return response.data; },
    getRankedObjectives: async (params) => { /* ... */ const response = await apiService.get('/analysis/ranked-objectives', { params }); return response.data; },
    getCategoryAverageProgress: async (params) => { /* ... */ const response = await apiService.get('/analysis/category-average-progress', { params }); return response.data; },
    getDetailedObjectivesByCategory: async (params) => { /* ... */ const response = await apiService.get('/analysis/objectives-by-category-detailed', { params }); return response.data; },


    // --- Perfil de Usuario ---
    getUserProfile: async () => {
        const response = await apiService.get('/profile/details');
        return response.data;
    },
    getUserProfileStats: async () => {
        const response = await apiService.get('/profile/stats');
        return response.data;
    },
    getUserAchievements: async () => {
        const response = await apiService.get('/profile/achievements');
        return response.data;
    },
    updateUserProfile: async (profileData) => {
        const response = await apiService.put('/profile/details', profileData);
        return response.data;
    },
    uploadAvatar: async (formData) => {
        const response = await apiService.post('/profile/avatar', formData);
        return response.data;
    },

    // --- Configuración ---
    getUserSettings: async () => {
        const response = await apiService.get('/settings');
        return response.data;
    },
    updateUserSettings: async (settingsData) => {
        const response = await apiService.put('/settings', settingsData);
        return response.data;
    },
    changePassword: async (passwordData) => {
        const response = await apiService.put('/settings/change-password', passwordData);
        return response.data;
    },
    exportUserData: async () => {
        const response = await apiService.get('/settings/export-data', { responseType: 'json' });
        return response.data;
    },
    deleteAccount: async () => {
        const response = await apiService.delete('/settings/account');
        return response.data;
    },
};

// Este bucle re-añade un try/catch a cada función que simplemente relanza el error.
// Dado que las funciones son async y usan await, los errores de apiService ya
// se propagarían como promesas rechazadas. Este bucle es redundante si solo
// relanza el error, pero podría usarse para logging centralizado si fuera necesario.
// Para mayor simplicidad, se podría eliminar si no se añade lógica adicional al catch.
for (const key in api) {
    if (typeof api[key] === 'function') {
        const originalFunction = api[key];
        api[key] = async (...args) => {
            try {
                return await originalFunction(...args);
            } catch (error) {
                // Aquí se podría añadir logging centralizado antes de relanzar
                // console.error(`API call to ${key} failed:`, error);
                throw error;
            }
        };
    }
}

export default api;