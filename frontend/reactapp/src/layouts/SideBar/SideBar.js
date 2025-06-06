import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SideBar.module.css';
import { FaPlus, FaHome, FaBullseye, FaChartBar, FaUser, FaCog } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <div className={styles.appLogoCircle}>
                    <span>G</span>
                </div>
                <span className={styles.appName}>GoalMaster</span>
            </div>

            <NavLink
                to="/objectives"
                className={({ isActive }) =>
                    `${styles.createButton} ${isActive ? styles.activeCreateButton : ''} btn-shine`
                }
            >
                <FaPlus className={styles.icon} /> {t('sidebar.newObjective')}
            </NavLink>

            <nav className={styles.navigation}>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
                    }
                >
                    <FaHome className={styles.icon} /> {t('sidebar.dashboard')}
                </NavLink>
                <NavLink
                    to="/mis-objetivos"
                    className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
                    }
                >
                    <FaBullseye className={styles.icon} /> {t('sidebar.myObjectives')}
                </NavLink>
                <NavLink
                    to="/analisis"
                    className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
                    }
                >
                    <FaChartBar className={styles.icon} /> {t('sidebar.analysis')}
                </NavLink>
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
                    }
                >
                    <FaUser className={styles.icon} /> {t('sidebar.myProfile')}
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
                    }
                >
                    <FaCog className={styles.icon} /> {t('sidebar.settings')}
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;