import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

function AuthLayout() {
    return (
        <div className={styles.authPage}>
            <main className={styles.mainContentArea}>
                <Outlet />
            </main>
        </div>
    );
}

export default AuthLayout;