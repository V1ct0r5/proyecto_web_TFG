import React, { forwardRef } from 'react';
import styles from './Input.module.css';
import { useTranslation } from 'react-i18next';

const Input = forwardRef(({
    type = 'text',
    id,
    placeholder,
    value,
    onChange,
    onBlur,
    disabled,
    isError,
    children,
    className,
    wrapperClassName = '',
    actionIcon,
    onActionClick,
    actionIconAriaLabel,
    ...rest
}, ref) => {
    const { t } = useTranslation();

    let elementClass = styles.input;
    let elementType = 'input';
    let specificInputType = type;

    if (type === 'textarea') {
        elementClass = styles.textarea;
        elementType = 'textarea';
    } else if (type === 'select') {
        elementClass = styles.select;
        elementType = 'select';
    }

    const finalInputClassName = `${elementClass} ${isError ? styles.error : ''} ${className || ''}`.trim();
    const finalWrapperClassName = `${styles.inputWrapper} ${wrapperClassName || ''}`.trim();

    const inputElement = () => {
        if (elementType === 'textarea') {
            return (
                <textarea
                    id={id}
                    className={finalInputClassName}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
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
                    className={finalInputClassName}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
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
                type={specificInputType}
                id={id}
                className={finalInputClassName}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                ref={ref}
                {...rest}
            />
        );
    };

    return (
        <div className={finalWrapperClassName}>
            {inputElement()}
            {actionIcon && onActionClick && (
                <button
                    type="button"
                    onClick={onActionClick}
                    className={styles.actionIconButton}
                    aria-label={actionIconAriaLabel || t('input.defaultActionAriaLabel')}
                    disabled={disabled}
                >
                    {actionIcon}
                </button>
            )}
        </div>
    );
});

export default Input;