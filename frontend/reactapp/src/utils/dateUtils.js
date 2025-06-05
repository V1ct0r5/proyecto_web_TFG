// frontend/reactapp/src/utils/dateUtils.js
import { format, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale'; // Importa los locales que soportas

const locales = {
  es: es,
  en: enUS,
  // Puedes añadir más mapeos de idioma a locales de date-fns aquí
};

// Mapeo de las preferencias de formato del usuario a los strings de formato de date-fns
const userFormatToDateFnsFormat = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

/**
 * Formatea una cadena de fecha (preferiblemente ISO 8601) según las preferencias del usuario.
 * @param {string | Date} dateInput - La fecha a formatear (cadena ISO o objeto Date).
 * @param {string} userFormatPreference - La preferencia de formato del usuario (ej. 'DD/MM/YYYY').
 * @param {string} langPreference - La preferencia de idioma del usuario (ej. 'es', 'en').
 * @returns {string} La fecha formateada o 'N/A' si la entrada es inválida.
 */
export const formatDateByPreference = (dateInput, userFormatPreference, langPreference = 'es') => {
  if (!dateInput || !userFormatPreference) {
    return 'N/A';
  }

  const formatString = userFormatToDateFnsFormat[userFormatPreference] || userFormatPreference;
  const localeToUse = locales[langPreference] || locales.es; // Fallback a español

  try {
    // Si dateInput ya es un objeto Date, no necesita parseISO.
    // Si es una cadena, parseISO es más robusto para formatos estándar.
    const dateObject = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;

    if (!isValid(dateObject)) {
        // console.warn(`Fecha inválida proporcionada a formatDateByPreference: ${dateInput}`);
        // Si la fecha no es ISO, pero podría ser ya un formato específico, intenta mostrarla
        // o devuelve N/A de forma más estricta. Por ahora, devolvemos la entrada.
        // Considera que si ya viene formateada y no es ISO, parseISO fallará.
        return typeof dateInput === 'string' ? dateInput.split('T')[0] : 'Fecha Inv.'; 
    }

    return format(dateObject, formatString, { locale: localeToUse });
  } catch (error) {
    console.error("Error formateando fecha:", dateInput, userFormatPreference, error);
    return typeof dateInput === 'string' ? dateInput : 'Error de Fecha'; // Fallback en caso de error de formato
  }
};