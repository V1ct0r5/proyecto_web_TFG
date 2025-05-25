import React from 'react';
import { ClipLoader } from 'react-spinners'; // Puedes elegir otro spinner si prefieres (ej. BarLoader, RingLoader)
import styles from './LoadingSpinner.module.css'; // Crea este archivo CSS modular

function LoadingSpinner({ size = 50, color = "#007bff", loading = true }) {
    return (
        <div className={styles.spinnerContainer}>
            <ClipLoader
                color={color}
                loading={loading}
                size={size}
                aria-label="Cargando..."
                data-testid="loader"
            />
        </div>
    );
}

export default LoadingSpinner;