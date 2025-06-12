// frontend/reactapp/src/layouts/AppHeader.js
import React from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from './AppHeader.module.css';
import buttonStyles from '../components/ui/Button.module.css'; // Asegúrate de que la ruta es correcta
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '../utils/routePaths'; // <-- Importamos las constantes

const AppHeader = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const getHeaderTitle = (pathname) => {
        // Mapeo de rutas a claves de traducción
        const titleMap = {
            [ROUTE_PATHS.DASHBOARD]: t('pageTitles.dashboard'),
            [ROUTE_PATHS.NEW_OBJECTIVE]: t('pageTitles.createObjective'),
            [ROUTE_PATHS.MY_OBJECTIVES]: t('pageTitles.myObjectives'),
            [ROUTE_PATHS.ANALYSIS]: t('pageTitles.analysis'),
            [ROUTE_PATHS.PROFILE]: t('pageTitles.profile'),
            [ROUTE_PATHS.SETTINGS]: t('pageTitles.settings'),
        };
        
        // Comprobar rutas estáticas primero
        if (titleMap[pathname]) {
            return titleMap[pathname];
        }

        // Comprobar rutas dinámicas
        if (matchPath(ROUTE_PATHS.EDIT_OBJECTIVE, pathname)) return t('pageTitles.editObjective');
        if (matchPath(ROUTE_PATHS.UPDATE_PROGRESS, pathname)) return t('pageTitles.updateProgress');
        if (matchPath(ROUTE_PATHS.VIEW_OBJECTIVE, pathname)) return t('pageTitles.objectiveDetails');

        return t('common.appName'); // Fallback
    };
    
    const pageTitle = getHeaderTitle(location.pathname);

    const handleLogout = () => {
        logout();
        toast.success(t('toast.logoutSuccess'));
        navigate(ROUTE_PATHS.LOGIN, { replace: true });
    };

    return (
        <header className={styles.header}>
            <h1 className={styles.headerPageTitle}>{pageTitle}</h1>
            {user && (
                <div className={styles.rightContent}>
                    <span className={styles.userInfo}>
                        {t('header.greeting', { name: user.username || t('common.userFallback') })}
                    </span>
                    <button onClick={handleLogout} className={`${buttonStyles.buttonSecondary} ${buttonStyles.secondary}`}>
                        {t('header.logoutButton')}
                    </button>
                </div>
            )}
        </header>
    );
}

export default AppHeader;