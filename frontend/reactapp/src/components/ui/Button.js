import React from 'react';
import styles from './Button.module.css';

function Button({ children, className, ...props }) {

    const buttonClasses = `${styles.button} ${className || ''}`;

    return (
        <button className={buttonClasses} {...props}>
        {children}
        </button>
    );
}

export default Button;