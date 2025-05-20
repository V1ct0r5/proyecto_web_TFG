import React from 'react';
import { Outlet } from 'react-router-dom'; // Importa Outlet para renderizar rutas hijas
import styles from './AuthLayout.module.css'; // Importa los estilos específicos del módulo

// Layout básico para las páginas de autenticación (Login, Registro)
function AuthLayout() {
    return (
        // Contenedor principal con la clase de estilo del layout
        <div className={styles.authPage}>
            <main className={styles.mainContentArea}>
                <Outlet />
            </main>
        </div>
    );
}

export default AuthLayout;