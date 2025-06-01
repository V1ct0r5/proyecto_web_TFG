import axios from "axios";
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const logoutEvent = new Event('logoutUser');
let logoutProcessInitiated = false;

apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && config.url !== '/auth/login' && config.url !== '/auth/register') {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
                        position: "top-center", autoClose: 4000, hideProgressBar: false,
                        closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
                    });
                    window.dispatchEvent(logoutEvent);
                    setTimeout(() => { logoutProcessInitiated = false; }, 5000);
                }
                return Promise.reject(new Error(data?.message || error.message || 'Authentication Error: Session Expired or Invalid Token'));
            }

            const errorMessage = data?.message || error.message || 'Ocurrió un error.';
            const errorToThrow = new Error(errorMessage);
            errorToThrow.data = data;
            errorToThrow.status = status;
            return Promise.reject(errorToThrow);

        } else if (error.request) {
            toast.error('Error de red. Por favor, verifica tu conexión.', { position: "top-center" });
            return Promise.reject(new Error('Error de red. Por favor, verifica tu conexión o intenta más tarde.'));
        } else {
            toast.error('Error al configurar la petición.', { position: "top-center" });
            return Promise.reject(new Error(`Error en la configuración de la petición: ${error.message}`));
        }
    }
);

const api = {
    register: async (userData) => {
        try {
            const response = await apiService.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    login: async (credentials) => {
        try {
            const response = await apiService.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    logout: async () => {
        try {
            const response = await apiService.delete('/auth/logout');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getObjectives: async () => {
        try {
            const response = await apiService.get('/objectives');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getObjectiveById: async (objectiveId) => {
        try {
            const response = await apiService.get(`/objectives/${objectiveId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createObjective: async (objectiveData) => {
        try {
            const response = await apiService.post('/objectives', objectiveData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateObjective: async (objectiveId, dataToUpdate) => {
        try {
            const response = await apiService.put(`/objectives/${objectiveId}`, dataToUpdate);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteObjective: async (objectiveId) => {
        try {
            const response = await apiService.delete(`/objectives/${objectiveId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getDashboardSummaryStats: async () => {
        try {
            const response = await apiService.get('/dashboard/summary-stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getDashboardRecentObjectives: async (limit = 4) => {
        try {
            const response = await apiService.get(`/dashboard/recent-objectives?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getDashboardRecentActivities: async (limit = 5) => {
        try {
            const response = await apiService.get(`/dashboard/recent-activities?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAnalysisSummary: async (params) => {
        try {
            const response = await apiService.get('/analysis/summary', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getCategoryDistribution: async (params) => {
        try {
            const response = await apiService.get('/analysis/distribution/category', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getObjectiveStatusDistribution: async (params) => {
        try {
            const response = await apiService.get('/analysis/distribution/status', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getMonthlyProgress: async (params) => {
        try {
            const response = await apiService.get('/analysis/progress/monthly', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getObjectivesProgressChartData: async (params) => {
        try {
            const response = await apiService.get('/analysis/objectives-progress', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getRankedObjectives: async (params) => {
        try {
            const response = await apiService.get('/analysis/ranked-objectives', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getCategoryAverageProgress: async (params) => {
        try {
            const response = await apiService.get('/analysis/category-average-progress', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getDetailedObjectivesByCategory: async (params) => {
        try {
            const response = await apiService.get('/analysis/objectives-by-category-detailed', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default api;