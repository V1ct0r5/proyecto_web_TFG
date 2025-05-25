// frontend/src/components/Sidebar/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SideBar.module.css';
import { FaPlus, FaHome, FaBullseye, FaChartBar, FaUser, FaCog } from 'react-icons/fa'; // Asegúrate de tener react-icons instalado

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        {/* Usamos el mismo estilo de logo circular que en AppHeader */}
        <div className={styles.appLogoCircle}>
            <span>G</span>
        </div>
        <span className={styles.appName}>GoalMaster</span>
      </div>

      {/* Botón "Nuevo Objetivo" */}
      {/* AÑADE LA CLASE btn-shine AQUÍ */}
      <NavLink to="/objectives" className={({ isActive }) =>
        // Aquí concatenamos la clase global 'btn-shine'
        `${styles.createButton} ${isActive ? styles.activeCreateButton : ''} btn-shine`
      }>
        <FaPlus className={styles.icon} /> Nuevo Objetivo
      </NavLink>

      <nav className={styles.navigation}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
          }
        >
          <FaHome className={styles.icon} /> Dashboard
        </NavLink>
        <NavLink
          to="/mis-objetivos"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
          }
        >
          <FaBullseye className={styles.icon} /> Mis Objetivos
        </NavLink>
        <NavLink
          to="/analisis"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
          }
        >
          <FaChartBar className={styles.icon} /> Análisis
        </NavLink>
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
          }
        >
          <FaUser className={styles.icon} /> Mi Perfil
        </NavLink>
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
          }
        >
          <FaCog className={styles.icon} /> Configuración
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;