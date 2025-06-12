// frontend/reactapp/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Carga traducciones desde una URL (ej. /locales/es/translation.json)
  .use(HttpApi)
  // Detecta automáticamente el idioma del usuario desde el navegador, localStorage, etc.
  .use(LanguageDetector)
  // Pasa la instancia de i18n a react-i18next para su uso en componentes
  .use(initReactI18next)
  .init({
    // Idioma a usar si el idioma detectado no está disponible
    fallbackLng: 'es',
    // Lista de idiomas soportados
    supportedLngs: ['es', 'en'],
    // Namespace por defecto a cargar
    defaultNS: 'translation',
    // Opciones para el backend que carga los archivos JSON
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Opciones para la detección de idioma
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    // Permite que React use Suspense para la carga asíncrona de traducciones
    react: {
      useSuspense: true,
    },
    interpolation: {
        // React ya protege contra ataques XSS, por lo que no es necesario escaparlo dos veces.
        escapeValue: false,
    }
  });

export default i18n;