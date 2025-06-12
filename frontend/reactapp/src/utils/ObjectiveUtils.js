// frontend/reactapp/src/utils/objectiveUtils.js
import React from 'react';
import { FaHeartbeat, FaPiggyBank, FaUserGraduate, FaUsers, FaBriefcase, FaStar } from 'react-icons/fa';

// Mapeo de valores ENUM de categoría a iconos
const categoryIconMap = {
    HEALTH: <FaHeartbeat />,
    FINANCE: <FaPiggyBank />,
    PERSONAL_DEV: <FaUserGraduate />,
    RELATIONSHIPS: <FaUsers />,
    CAREER: <FaBriefcase />,
    OTHER: <FaStar />
};

/**
 * Devuelve el componente de icono correspondiente a una categoría.
 * @param {string} category - La clave de la categoría (ej. 'HEALTH').
 * @returns {React.Component} El componente del icono.
 */
export const getCategoryIcon = (category) => {
    return categoryIconMap[category] || <FaStar />;
};


// Mapeo de valores ENUM de estado a claves de traducción y clases CSS
const statusInfoMap = {
    PENDING: { key: 'status.pending', className: 'statusPending' },
    IN_PROGRESS: { key: 'status.inProgress', className: 'statusInProgress' },
    COMPLETED: { key: 'status.completed', className: 'statusCompleted' },
    ARCHIVED: { key: 'status.archived', className: 'statusArchived' },
    FAILED: { key: 'status.failed', className: 'statusFailed' }
};

/**
 * Devuelve el texto traducido y la clase CSS para un estado de objetivo.
 * @param {string} status - La clave del estado (ej. 'IN_PROGRESS').
 * @param {function} t - La función de traducción de i18next.
 * @returns {{translatedStatus: string, statusClassName: string}}
 */
export const getStatusInfo = (status, t) => {
    const info = statusInfoMap[status] || { key: `status.${status?.toLowerCase()}`, className: `status${status}` };
    return {
        translatedStatus: t(info.key, status),
        statusClassName: info.className
    };
};