import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query'; // 1. IMPORTA LO NECESARIO DE REACT-QUERY

import App from './App';
import FullPageLoader from './components/ui/FullPageLoader'; // Un componente de carga es mejor que un texto
import reportWebVitals from './reportWebVitals';

// Estilos globales
import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';

// Configuración de internacionalización
import './i18n';

// 2. CREA UNA INSTANCIA DEL CLIENTE DE REACT-QUERY
// Aquí puedes definir configuraciones por defecto para todas tus peticiones
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 minutos
      cacheTime: 1000 * 60 * 30, // Los datos se mantienen en caché por 30 minutos
      refetchOnWindowFocus: false, // Opcional: previene recargas al cambiar de pestaña
      retry: 1, // Reintentar peticiones fallidas 1 sola vez
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza la aplicación
root.render(
  <React.StrictMode>
    <Suspense fallback={<FullPageLoader />}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Suspense>
  </React.StrictMode>
);

// Si quieres medir el rendimiento, puedes dejar esta línea
reportWebVitals();
