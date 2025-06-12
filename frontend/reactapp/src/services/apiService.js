// frontend/reactapp/src/services/apiService.js
import axios from "axios";
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const apiService = axios.create({
    baseURL: API_BASE_URL,
});

let isLogoutProcessInitiated = false;

// Interceptor para añadir el token de autenticación a las cabeceras
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar globalmente las respuestas y los errores
apiService.interceptors.response.use(
    response => response.data, // Devuelve directamente la data de la respuesta
    async (error) => {
        const originalRequest = error.config;

        if (error.response) {
            const { status, data } = error.response;

            // Si el error es 401/403 y no es un reintento, cerrar la sesión.
            if ((status === 401 || status === 403) && !originalRequest._retry) {
                originalRequest._retry = true;
                if (!isLogoutProcessInitiated) {
                    isLogoutProcessInitiated = true;
                    toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', { position: "top-center" });
                    // Dispara un evento global para que el AuthContext pueda reaccionar
                    window.dispatchEvent(new CustomEvent('logoutUser'));
                    setTimeout(() => { isLogoutProcessInitiated = false; }, 5000);
                }
            }

            // Propagar un error formateado para que los componentes puedan usarlo
            const errorMessage = data?.message || (Array.isArray(data?.errors) ? data.errors.map(e => e.msg).join(', ') : 'Ocurrió un error.');
            const errorToThrow = new Error(errorMessage);
            errorToThrow.data = data;
            errorToThrow.status = status;
            return Promise.reject(errorToThrow);
        }

        if (error.request) {
            toast.error('Error de red. No se pudo conectar con el servidor.', { position: "top-center" });
        }
        
        return Promise.reject(error);
    }
);

/**
 * Objeto que contiene todos los métodos para interactuar con la API del backend.
 * Nota: El interceptor ya extrae 'res.data', por lo que podemos simplificar los '.then()'.
 */
const api = {
    // --- Auth ---
    register: (userData) => apiService.post('/auth/register', userData),
    login: (credentials) => apiService.post('/auth/login', credentials),
    logout: () => apiService.post('/auth/logout'),

    // --- Objectives ---
    getObjectives: (filters) => apiService.get('/objectives', { params: filters }).then(res => res.data.objectives),
    getObjectiveById: (id) => apiService.get(`/objectives/${id}`).then(res => res.data.objective),
    createObjective: (data) => apiService.post('/objectives', data).then(res => res.data.objective),
    updateObjective: (id, data) => apiService.put(`/objectives/${id}`, data).then(res => res.data.objective),
    deleteObjective: (id) => apiService.delete(`/objectives/${id}`),

    // --- Dashboard ---
    getDashboardSummary: () => apiService.get('/dashboard/summary-stats').then(res => res.data),
    getRecentObjectives: (limit = 4) => apiService.get(`/dashboard/recent-objectives?limit=${limit}`).then(res => res.data),
    getRecentActivities: (limit = 5) => apiService.get(`/dashboard/recent-activities?limit=${limit}`).then(res => res.data),

    // --- Analysis ---
    getAnalysisSummary: (params) => apiService.get('/analysis/summary', { params }).then(res => res.data),
    getCategoryDistribution: (params) => apiService.get('/analysis/category-distribution', { params }).then(res => res.data),
    getObjectiveStatusDistribution: (params) => apiService.get('/analysis/status-distribution', { params }).then(res => res.data),
    getMonthlyProgress: (params) => apiService.get('/analysis/monthly-progress', { params }).then(res => res.data),
    getObjectivesProgressChartData: (params) => apiService.get('/analysis/objective-progress-chart-data', { params }).then(res => res.data),
    getRankedObjectives: (params) => apiService.get('/analysis/ranked-objectives', { params }).then(res => res.data),
    getCategoryAverageProgress: (params) => apiService.get('/analysis/category-average-progress', { params }).then(res => res.data),
    getDetailedObjectivesByCategory: (params) => apiService.get('/analysis/detailed-by-category', { params }).then(res => res.data),

    // --- Profile (SECCIÓN CORREGIDA) ---
    /**
     * Obtiene los datos del perfil del usuario.
     * GET /api/profile
     */
    getUserProfile: () => apiService.get('/profile').then(res => res.data),

    /**
     * Actualiza el perfil del usuario (texto y/o avatar).
     * Envía todos los datos en un único FormData.
     * PATCH /api/profile
     * @param {FormData} formData - Objeto FormData con los campos de texto y el archivo 'avatar' opcional.
     */
    updateUserProfile: (formData) => apiService.patch('/profile', formData).then(res => res.data),

    /**
     * Obtiene las estadísticas del perfil del usuario.
     * GET /api/profile/stats
     */
    getUserProfileStats: () => apiService.get('/profile/stats').then(res => res.data),

    // La función 'uploadAvatar' ya no es necesaria y se puede eliminar.

    // --- Settings ---
    getUserSettings: () => apiService.get('/settings').then(res => res.data),
    updateUserSettings: (data) => apiService.put('/settings', data),
    changePassword: (data) => apiService.put('/settings/change-password', data),
    exportUserData: () => apiService.get('/settings/export-data'),
    deleteAccount: () => apiService.delete('/settings/account'),
};

export default api;
