// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi) // Carga traducciones desde una URL (ej. /locales/{{lng}}/{{ns}}.json)
  .use(LanguageDetector) // Detecta el idioma del usuario
  .use(initReactI18next) // Pasa la instancia de i18n a react-i18next
  .init({
    // Idiomas disponibles
    supportedLngs: ['en', 'es'],
    // Idioma por defecto si el detectado no está disponible
    fallbackLng: 'en',
    // Namespace por defecto
    ns: 'translation',
    defaultNS: 'translation',
    // Opciones para el backend (dónde encontrar los JSON)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Opciones para el detector de idioma
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
    },
    // Opciones de React
    react: {
      useSuspense: true, // Usa Suspense de React para la carga de traducciones
    },
    interpolation: {
        escapeValue: false // React ya escapa los valores para prevenir XSS
    }
  });

export default i18n;