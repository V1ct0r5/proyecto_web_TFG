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
        console.log("API Interceptor: Intercepting request to:", config.url); // Log the URL
        const token = localStorage.getItem("token");
        console.log("API Interceptor: Token found in localStorage:", token ? "Exists" : "Does NOT exist"); // Log if token exists

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log("API Interceptor: Authorization header added."); // Log if header is added
        } else {
             console.log("API Interceptor: No token found, Authorization header NOT added."); // Log if header is NOT added
        }
        return config;
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
    register: async (userData) => {
        try {
            // Espera la respuesta de la llamada POST
            const response = await apiService.post('/auth/register', userData);

            // Procesa la respuesta exitosa para extraer token y user
            const user = response.data;
            let token = response.data.token;

            const authHeader = response.headers['authorization'] || response.headers['Authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }

            return { token: token, user: user };

        } catch (error) {
            throw error;
        }
    },
    login: (credentials) => apiService.post('/auth/login', credentials),
    logout: () => apiService.delete('/auth/logout'),

    // Rutas de objetivos
    getObjectives: () => apiService.get('/objectives'),
    createObjective: (objectiveData) => apiService.post('/objectives', objectiveData),
    updateObjective: (objectiveId, objectiveData) => apiService.put(`/objectives/${objectiveId}`, objectiveData),
    deleteObjective: (objectiveId) => apiService.delete(`/objectives/${objectiveId}`)
};

export default api;