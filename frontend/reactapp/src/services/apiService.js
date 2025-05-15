import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

// Crea una instancia de axios con la configuración base
const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token de autorización a las solicitudes
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // Si hay un token, lo agrega a los headers de la solicitud
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Manejo de errores de la solicitud antes de enviarla
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error
apiService.interceptors.response.use(
    response => response,
    error => {
        // Si la respuesta es un error
        console.error('API Response Error:', error.response || error.message);
        if(error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Si el error es de autorización, redirigir al usuario a la página de login
            console.warn('Authentication/Authorization error. Redirecting to login...');
            localStorage.removeItem("token");
        }

        return Promise.reject(error);
    }
);

// Funciones para realizar solicitudes a la API
const api = {
    // Rutas de autenticación
    register: (userData) => apiService.post('/auth/register', userData),
    login: (credentials) => apiService.post('/auth/login', credentials),
    logout: () => apiService.delete('/auth/logout'),

    // Rutas de objetivos
    getObjectives: () => apiService.get('/objectives'),
    createObjective: (objectiveData) => apiService.post('/objectives', objectiveData),
    updateObjective: (objectiveId, objectiveData) => apiService.put(`/objectives/${objectiveId}`, objectiveData),
    deleteObjective: (objectiveId) => apiService.delete(`/objectives/${objectiveId}`)
};

export default api;