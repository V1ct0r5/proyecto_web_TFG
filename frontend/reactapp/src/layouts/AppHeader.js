import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './AppHeader.module.css';
import buttonStyles from '../components/ui/Button.module.css';
import { useTranslation } from 'react-i18next';

const AppHeader = () => {
    const { user, isAuthenticated, logout: contextLogout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const getHeaderTitle = (pathname) => {
        const path = pathname.toLowerCase();
        if (path.startsWith('/objectives/edit/')) return t('pageTitles.editObjective');
        if (path.startsWith('/objectives/view/')) return t('pageTitles.objectiveDetails');
        if (path.startsWith('/objectives/')) {
            if (path.includes('/update-progress')) return t('pageTitles.updateProgress');
            if (path.split('/').length === 3) return t('pageTitles.objectiveDetails');
        }
        switch (path) {
            case '/dashboard':
                return t('pageTitles.dashboard');
            case '/objectives':
                return t('pageTitles.createObjective');
            case '/mis-objetivos':
                return t('pageTitles.myObjectives');
            case '/analisis':
                return t('pageTitles.analysis');
            case '/profile':
                return t('pageTitles.profile');
            case '/settings': // Corregido de '/configuracion'
                return t('pageTitles.settings');
            default:
                return t('common.appName');
        }
    };
    
    const pageTitle = getHeaderTitle(location.pathname);

    const handleLogout = async () => {
        try {
            await api.logout();
            toast.success(t('toast.logoutSuccess'));
        } catch (err) {
            if (!(err.response && (err.response.status === 401 || err.response.status === 403))) {
                toast.error(t('toast.logoutError'));
            }
        } finally {
            contextLogout();
            navigate("/login", { replace: true });
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.leftContent}>
                {pageTitle ? (
                    <h1 className={styles.headerPageTitle}>{pageTitle}</h1>
                ) : (
                    <div className={styles.headerPlaceholder}></div>
                )}
            </div>

            {user && (
                <div className={styles.rightContent}>
                    <span className={styles.userInfo}>
                        {t('header.greeting', { name: user.nombre_usuario || t('common.userFallback') })}
                    </span>
                    <button
                        onClick={handleLogout}
                        className={`${buttonStyles.buttonSecondary} ${buttonStyles.secondary}`}
                        aria-label={t('header.logoutAriaLabel')}
                    >
                        {t('header.logoutButton')}
                    </button>
                </div>
            )}
        </header>
    );
}

export default AppHeader;