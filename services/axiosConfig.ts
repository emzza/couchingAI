import axios from 'axios';

// Crear instancia de Axios con configuración base
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('Error de red:', error.request);
    } else {
      // Algo sucedió al configurar la petición
      console.error('Error:', error.message);
    }

    // Manejo específico de errores CORS
    if (error.message.includes('Network Error') || error.message.includes('CORS')) {
      console.error('Error CORS detectado:', {
        message: error.message,
        config: error.config,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }

    return Promise.reject(error);
  }
);

// Función para hacer ping al servidor
export const pingServer = async () => {
  try {
    const response = await axiosInstance.get('/api/whatsapp/ping', {
      headers: {
        // No incluimos headers de CORS aquí
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error('Error en ping al servidor:', error);
    return false;
  }
};

export default axiosInstance; 