import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'; // Importar useImperativeHandle
import { format, isValid, parseISO } from 'date-fns'; // Importar parseISO
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilos por defecto de react-calendar
import './DatePicker.css'; // Estilos personalizados

// Componente DatePicker que envuelve react-calendar para integración con formularios
// Usa forwardRef para permitir que react-hook-form adjunte una referencia al input visible
const DatePicker = forwardRef(({
    value, // Valor actual del campo (pasado por react-hook-form)
    onChange, // Función para actualizar el valor (pasada por react-hook-form)
    onBlur, // Función para manejar el evento blur (pasada por react-hook-form)
    disabled, // Indica si el selector está deshabilitado
    placeholder = "Selecciona una fecha", // Texto del placeholder
    className, // Clases CSS adicionales para el contenedor principal
    isError, // Indica si hay un error de validación (para estilos)
    minDate, // Fecha mínima permitida en el calendario
    maxDate, // Fecha máxima permitida en el calendario (añadido por consistencia)
}, ref) => {
    // Estado local para controlar la visibilidad del calendario emergente
    const [showCalendar, setShowCalendar] = useState(false);
    // Referencia para el contenedor principal del DatePicker, usada para detectar clics fuera
    const containerRef = useRef(null);

    // useImperativeHandle permite exponer funcionalidades específicas del componente hijo
    // al ref que recibe del padre. En este caso, se expone el containerRef.current
    // para que react-hook-form pueda adjuntar su referencia al elemento DOM para el blur.
    useImperativeHandle(ref, () => containerRef.current);

    // Formatea el valor actual (objeto Date) a una cadena legible 'dd/MM/yyyy' para mostrar en el input
    const formattedValue = value && isValid(value) ? format(value, 'dd/MM/yyyy') : '';

    // Manejador para cuando se selecciona una fecha en el calendario
    const handleCalendarChange = (date) => {
        // console.log('DatePicker: handleCalendarChange called'); // Log de depuración
        // console.log('DatePicker: Date received from Calendar:', date); // Log de depuración

        // Verifica si la fecha recibida es un objeto Date válido.
        // react-calendar a veces puede devolver un array si se usa selección de rango.
        const dateToPass = (date instanceof Date && isValid(date)) ? date : null;

        // Llama a la función onChange proporcionada por react-hook-form con el objeto Date válido (o null)
        // console.log('DatePicker: Passing date to react-hook-form onChange:', dateToPass); // Log de depuración
        onChange(dateToPass);

        // Cierra el calendario después de seleccionar una fecha
        setShowCalendar(false);

        // Opcional: Disparar onBlur después de la selección para activar validación si es necesario
        if (onBlur) {
            onBlur();
        }
    };

    // Manejador para cuando se hace clic en el botón de limpiar
    const handleClear = (e) => {
        e.stopPropagation(); // Evita que el clic se propague y cierre el calendario
        // console.log('DatePicker: Clearing date'); // Log de depuración
        onChange(null); // Limpia el valor en react-hook-form
        setShowCalendar(false); // Cierra el calendario

        // Opcional: Disparar onBlur después de limpiar
        if (onBlur) {
            onBlur();
        }
    };

    // Efecto para manejar clics fuera del componente y cerrar el calendario
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si el clic fue fuera del contenedor principal del DatePicker y el calendario está visible
            if (containerRef.current && !containerRef.current.contains(event.target) && showCalendar) {
                // console.log('Click outside DatePicker container, closing calendar'); // Log de depuración
                setShowCalendar(false); // Cierra el calendario
                 // Dispara onBlur cuando el calendario se cierra por clic fuera, para react-hook-form
                if (onBlur) {
                     onBlur();
                }
            }
            //  else {
            //      console.log('Click inside DatePicker container or calendar is not shown'); // Log de depuración
            //  }
        };

        // Añade el event listener al documento
        document.addEventListener('mousedown', handleClickOutside); // Usar mousedown es a menudo preferible a mouseup para detectar clics fuera más rápido
        // Función de limpieza: remueve el event listener al desmontar el componente
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    // Dependencias del efecto: se ejecuta si containerRef.current, showCalendar o onBlur cambian
    }, [containerRef, showCalendar, onBlur]);


    // Renderiza la estructura del DatePicker
    return (
        <div className={`date-picker-container ${className || ''} ${isError ? 'is-error' : ''}`} ref={containerRef}>
            <div className="date-picker-input-container">
                <input
                    type="text"
                    className="date-display-input"
                    readOnly
                    placeholder={placeholder}
                    value={formattedValue}
                    onClick={() => !disabled && setShowCalendar(!showCalendar)}
                    disabled={disabled}
                />
                {value && (
                    <button
                        type="button"
                        className="clear-button"
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        ×
                    </button>
                )}
            </div>
            {showCalendar && (
                <div className="date-picker-dropdown">
                    <Calendar
                        onChange={handleCalendarChange}
                        value={value || new Date()}
                        className="react-calendar"
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
            )}
        </div>
    );    
});

export default DatePicker;