// frontend/reactapp/src/layouts/SideBar/SideBar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SideBar.module.css';
import { FaPlus, FaHome, FaBullseye, FaChartBar, FaUser, FaCog } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isSidebarOpen }) => {
    const { t } = useTranslation();

    const navItems = [
        { to: "/dashboard", icon: <FaHome className={styles.icon} />, label: t('sidebar.dashboard') },
        { to: "/mis-objetivos", icon: <FaBullseye className={styles.icon} />, label: t('sidebar.myObjectives') },
        { to: "/analisis", icon: <FaChartBar className={styles.icon} />, label: t('sidebar.analysis') },
        { to: "/profile", icon: <FaUser className={styles.icon} />, label: t('sidebar.myProfile') },
        { to: "/settings", icon: <FaCog className={styles.icon} />, label: t('sidebar.settings') },
    ];

    return (
        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarVisible : ''}`}>
            <div className={styles.logoContainer}>
                <div className={styles.appLogoCircle}>
                    <span>G</span>
                </div>
                <span className={styles.appName}>GoalMaster</span>
            </div>

            <NavLink to="/objectives" className={`${styles.createButton} btn-shine`}>
                <FaPlus className={styles.icon} /> {t('sidebar.newObjective')}
            </NavLink>

            <nav className={styles.navigation}>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;