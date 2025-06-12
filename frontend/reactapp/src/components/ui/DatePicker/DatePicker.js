// frontend/reactapp/src/components/ui/DatePicker/DatePicker.js
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { format, isValid } from 'date-fns';
import Calendar from 'react-calendar';
import './DatePicker.css'; // Estilos personalizados
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../context/SettingsContext';

const DatePicker = forwardRef(({ value, onChange, onBlur, disabled, minDate, ...props }, ref) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const [showCalendar, setShowCalendar] = useState(false);
    const containerRef = useRef(null);

    useImperativeHandle(ref, () => containerRef.current);

    const displayFormat = settings.dateFormat?.replace(/Y/g, 'y') || 'dd/MM/yyyy';
    const formattedValue = value && isValid(value) ? format(value, displayFormat) : '';

    const handleCalendarChange = (date) => {
        onChange(date instanceof Date && isValid(date) ? date : null);
        setShowCalendar(false);
        if (onBlur) onBlur();
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        if (onBlur) onBlur();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="date-picker-container" ref={containerRef}>
            <div className="date-picker-input-container">
                <input
                    type="text"
                    className="date-display-input"
                    readOnly
                    value={formattedValue}
                    onClick={() => !disabled && setShowCalendar(s => !s)}
                    disabled={disabled}
                    {...props}
                />
                {value && !disabled && (
                    <button type="button" className="clear-button" onClick={handleClear}>×</button>
                )}
            </div>
            {showCalendar && (
                <div className="date-picker-dropdown">
                    <Calendar
                        onChange={handleCalendarChange}
                        value={value || new Date()}
                        minDate={minDate} 
                    />
                </div>
            )}
        </div>
    );    
});

export default DatePicker;