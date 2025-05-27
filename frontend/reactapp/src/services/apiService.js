// frontend/reactapp/src/services/apiService.js
import axios from "axios";

// Considera obtener esto de una variable de entorno para flexibilidad
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

// Crea una instancia de axios con la configuración base
const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // timeout: 10000, // Opcional: tiempo de espera para las peticiones
});

// Interceptor para agregar el token de autorización a las solicitudes
apiService.interceptors.request.use(
    (config) => {
        // console.log("[API Interceptor] Request URL:", config.url); // Descomentar para depuración
        const token = localStorage.getItem("token");
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            // console.log("[API Interceptor] Authorization header añadido."); // Descomentar para depuración
        } else {
            // console.log("[API Interceptor] Sin token, cabecera Authorization no añadida."); // Descomentar para depuración
        }
        return config;
    },
    (error) => {
        // console.error("[API Interceptor] Error en la configuración de la petición:", error); // Descomentar para depuración
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error globales
// (como errores 401/403 para desloguear al usuario)
apiService.interceptors.response.use(
    response => response, // Simplemente devuelve la respuesta si es exitosa
    error => {
        // console.error('[API Service] Error en la respuesta:', error.response || error); // Descomentar para depuración detallada

        if (error.response) {
            // El servidor respondió con un estado fuera del rango 2xx
            const { status, data } = error.response;
            
            if (status === 401 || status === 403) {
                // Error de autenticación o autorización
                // console.warn(`[API Service] Error ${status}. Limpiando token y posiblemente redirigiendo.`);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                
                // Por ahora, la redirección se confiará a ProtectedRoute si isAuthenticated se vuelve false.
                // Asegúrate que tu AuthContext.logout() es llamado o que el cambio de estado fuerza la redirección.
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    // Evitar bucles de redirección si ya está en login/registro
                    // window.location.href = '/login'; // Esto es un hard refresh, mejor usar navigate de react-router
                }
            }
            // Propagar un error más estructurado si es posible
            const errorToThrow = new Error(data?.message || error.message || 'Error desconocido de la API');
            errorToThrow.data = data; // Adjuntar los datos del error del backend
            errorToThrow.status = status;
            return Promise.reject(errorToThrow);

        } else if (error.request) {
            // La petición se hizo pero no se recibió respuesta (ej. error de red, servidor caído)
            // console.error('[API Service] Error de red o sin respuesta del servidor:', error.request);
            return Promise.reject(new Error('Error de red. Por favor, verifica tu conexión o intenta más tarde.'));
        } else {
            // Algo pasó al configurar la petición que generó un error
            // console.error('[API Service] Error al configurar la petición:', error.message);
            return Promise.reject(new Error(`Error en la configuración de la petición: ${error.message}`));
        }
    }
);

// Funciones para realizar solicitudes a la API
const api = {
    // Rutas de autenticación
    register: async (userData) => {
        try {
            const response = await apiService.post('/auth/register', userData);
            // Asumimos que el backend devuelve { token, usuario: { ... } } o similar en response.data
            // donde usuario NO tiene la contraseña.
            return response.data; 
        } catch (error) {
            // El interceptor de respuesta ya debería haber formateado el error.
            // Se propaga para que el componente que llama (ej. RegistroForm) lo maneje.
            throw error; 
        }
    },
    login: async (credentials) => {
        try {
            const response = await apiService.post('/auth/login', credentials);
            // Asumimos que el backend devuelve { token, usuario: { ... }, hasObjectives }
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // logout usa POST para coincidir con userRoutes.js
    logout: async () => { 
        try {
            const response = await apiService.delete('/auth/logout'); // Cambiado a POST
            return response.data; // El backend podría devolver un mensaje de éxito
        } catch (error) {
            throw error;
        }
    },

    // Rutas de objetivos
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
    // Para actualizar, la API espera: objectiveId, userId, objectiveData, progressData (este último opcional)
    // El apiService debería simplificar esto para el componente.
    // El userId se infiere del token en el backend.
    updateObjective: async (objectiveId, dataToUpdate) => { 
        // dataToUpdate podría ser: { ...camposDelObjetivo, progressValorActual, comentarios_progreso }
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
            return response.data; // O simplemente devolver status/vacío si el backend no devuelve cuerpo
        } catch (error) {
            throw error;
        }
    },
};

export default api;