// frontend/reactapp/src/services/apiService.js
import axios from "axios";
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

let isSessionExpiredMessageShown = false;

// Interceptor para añadir el token de autenticación a las cabeceras
axiosInstance.interceptors.request.use(
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
axiosInstance.interceptors.response.use(
    (response) => response.data, // Devuelve directamente la data de la respuesta
    async (error) => {
        const { config: originalRequest, response } = error;

        if (!response) {
            toast.error('Error de red. No se pudo conectar con el servidor.');
            return Promise.reject(error);
        }

        const { status, data } = response;
        const isLoginRequest = originalRequest.url.endsWith('/auth/login');

        if ((status === 401 || status === 403) && !isLoginRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            if (!isSessionExpiredMessageShown) {
                isSessionExpiredMessageShown = true;
                toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                window.dispatchEvent(new CustomEvent('logoutUser'));
                setTimeout(() => { isSessionExpiredMessageShown = false; }, 5000);
            }
        }

        const errorMessage = data?.message || 
                             (Array.isArray(data?.errors) ? data.errors.map(e => e.msg).join(', ') : 'Ocurrió un error inesperado.');
        
        const errorToThrow = new Error(errorMessage);
        errorToThrow.data = data;
        errorToThrow.status = status;
        
        return Promise.reject(errorToThrow);
    }
);


const api = {
    // Auth
    register: (userData) => axiosInstance.post('/auth/register', userData),
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    logout: () => axiosInstance.post('/auth/logout'),

    // Objectives
    getObjectives: (filters) => axiosInstance.get('/objectives', { params: filters }),
    getObjectiveById: (id) => axiosInstance.get(`/objectives/${id}`),
    createObjective: (data) => axiosInstance.post('/objectives', data),
    updateObjective: (id, data) => axiosInstance.put(`/objectives/${id}`, data),
    deleteObjective: (id) => axiosInstance.delete(`/objectives/${id}`),
    unarchiveObjective: (id) => axiosInstance.patch(`/objectives/${id}/unarchive`),

    // Dashboard
    getDashboardSummary: () => axiosInstance.get('/dashboard/summary-stats'),
    getRecentObjectives: (limit = 4) => axiosInstance.get(`/dashboard/recent-objectives?limit=${limit}`),
    getRecentActivities: (limit = 5) => axiosInstance.get(`/dashboard/recent-activities?limit=${limit}`),

    // Analysis
    getAnalysisSummary: (params) => axiosInstance.get('/analysis/summary', { params }),
    getCategoryDistribution: (params) => axiosInstance.get('/analysis/category-distribution', { params }),
    getObjectiveStatusDistribution: (params) => axiosInstance.get('/analysis/status-distribution', { params }),
    getMonthlyProgress: (params) => axiosInstance.get('/analysis/monthly-progress', { params }),
    getObjectivesProgressChartData: (params) => axiosInstance.get('/analysis/objective-progress-chart-data', { params }),
    getRankedObjectives: (params) => axiosInstance.get('/analysis/ranked-objectives', { params }),
    getCategoryAverageProgress: (params) => axiosInstance.get('/analysis/category-average-progress', { params }),
    getDetailedObjectivesByCategory: (params) => axiosInstance.get('/analysis/detailed-by-category', { params }),
    
    // Profile
    getUserProfile: () => axiosInstance.get('/profile'),
    updateUserProfile: (formData) => axiosInstance.patch('/profile', formData),
    getUserProfileStats: () => axiosInstance.get('/profile/stats'),

    // Settings
    getUserSettings: () => axiosInstance.get('/settings'),
    updateUserSettings: (data) => axiosInstance.put('/settings', data),
    changePassword: (data) => axiosInstance.put('/settings/change-password', data),
    exportUserData: () => axiosInstance.get('/settings/export-data'),
    deleteAccount: () => axiosInstance.delete('/settings/account'),
};

export default api;
