import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import styles from './FullPageLoader.module.css';

const FullPageLoader = ({ message }) => {
    return (
        <div className={styles.loaderOverlay}>
            <div className={styles.loaderContent}>
                <LoadingSpinner size="large" text="" />
                {message && <p className={styles.loaderMessage}>{message}</p>}
            </div>
        </div>
    );
};

export default FullPageLoader;