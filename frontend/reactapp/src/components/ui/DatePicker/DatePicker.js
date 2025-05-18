import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { format, isValid } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './DatePicker.css';


const DatePicker = forwardRef(({
    value,
    onChange,
    disabled,
    placeholder = "Selecciona una fecha",
    className,
    isError,
    minDate,
}, ref) => {
    const [showCalendar, setShowCalendar] = useState(false);

    const formattedValue = value && isValid(new Date(value)) ? format(new Date(value), 'dd/MM/yyyy') : '';

    const handleCalendarChange = (date) => {
        console.log('DatePicker: handleCalendarChange called');
        console.log('DatePicker: Date received from Calendar:', date);

        const dateToPass = (date instanceof Date && isValid(date)) ? date : null;

        console.log('DatePicker: Passing date to react-hook-form onChange:', dateToPass);
        onChange(dateToPass);




    };

    const handleClear = (e) => {
        e.stopPropagation();
        console.log('DatePicker: Clearing date');
        onChange(null);
        setShowCalendar(false);
    };


    useEffect(() => {
        const handleClickOutside = (event) => {

            if (ref.current && !ref.current.contains(event.target)) {
                console.log('Click outside DatePicker container, closing calendar');
                setShowCalendar(false);
            } else {
                console.log('Click inside DatePicker container, not closing');
            }
        };


        document.addEventListener('mouseup', handleClickOutside, true);
        return () => {
            document.removeEventListener('mouseup', handleClickOutside, true);
        };

    }, [ref]);


    return (
        <div
            className={`date-picker-container ${className || ''} ${isError ? 'is-error' : ''}`}
            ref={ref}
        >
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

                    />
                </div>
            )}
        </div>
    );
});

export default DatePicker;