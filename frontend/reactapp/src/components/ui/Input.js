import React from 'react';
import styles from './Input.module.css';

const Input = React.forwardRef(({ type, id, placeholder, value, onChange, disabled, isError, children, ...rest }, ref) => {

    let elementClass = styles.input;
    let elementType = 'input';

    if (type === 'textarea') {
        elementClass = styles.textarea;
        elementType = 'textarea';
    } else if (type === 'select') {
        elementClass = styles.select;
        elementType = 'select';
    }

    const inputClassName = isError
        ? `${elementClass} ${styles.error}`
        : elementClass;

    if (elementType === 'textarea') {
        return (
            <textarea
                id={id}
                className={inputClassName}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                ref={ref}
                {...rest}
            />
        );
    }

    if (elementType === 'select') {
        return (
            <select
                id={id}
                className={inputClassName}
                value={value}
                onChange={onChange}
                disabled={disabled}
                ref={ref}
                {...rest}
            >
                {children}
            </select>
        );
    }

    return (
        <input
            type={type}
            id={id}
            className={inputClassName}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            ref={ref}
            {...rest}
        />
    );
});

export default Input;