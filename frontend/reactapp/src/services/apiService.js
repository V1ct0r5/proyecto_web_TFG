import axios from "axios";

// Define la url base de la API
const API_BASE_URL = "http://localhost:3000/api";

// Crea una instancia de axios con la configuración base
const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token de autorización a las solicitudes
// Este interceptor se ejecuta antes de que la solicitud sea enviada
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
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error
// Este interceptor se ejecuta después de que la respuesta es recibida
apiService.interceptors.response.use(
    response => response,
    error => {
        // Si la respuesta es un error
        console.error('Error en la API:', error.response || error.message);
        if(error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Si el error es de autorización, redirigir al usuario a la página de login
            console.warn('Token inválido o expirado. Redirigiendo a la página de login...');
        }

        return Promise.reject(error);
    }
);

// Funciones para realizar solicitudes a la API
const api = {
    // Rutas de autenticación
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => apiService.post('/auth/login', credentials),

    // Rutas de objetivos
    getObjectives: () => api.get('/objectives'),
    createObjective: (objectiveData) => api.post('/objectives', objectiveData),
    updateObjective: (objectiveId, objectiveData) => api.put(`/objectives/${objectiveId}`, objectiveData),
    deleteObjective: (objectiveId) => api.delete(`/objectives/${objectiveId}`)
};

// Exporta la instancia de axios y las funciones de la API
export default api;