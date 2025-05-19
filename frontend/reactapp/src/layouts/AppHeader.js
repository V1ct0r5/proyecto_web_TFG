import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './AppHeader.module.css';
import buttonStyles from '../components/ui/Button.module.css';

function AppHeader() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.logout();
            toast.success('Sesión cerrada con éxito.');
        } catch (err) {
            console.error("Error al cerrar sesión en el backend:", err);
            toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
        } finally {
            logout();
            navigate("/login");
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftContent}>
                <div className={styles.headerLogoCircle}>
                    <span>G</span>
                </div>
                <span className={styles.headerBrand}>GoalMaster</span>
            </div>

            {isAuthenticated && user && (
                <div className={styles.rightContent}>
                    <span className={styles.userInfo}>Hola, {user.nombre_usuario || 'Usuario'}!</span>
                    <button onClick={handleLogout} className={buttonStyles.buttonSecondary}>
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </header>
    );
}

export default AppHeader;