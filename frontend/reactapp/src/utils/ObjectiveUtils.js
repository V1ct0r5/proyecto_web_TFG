import React from 'react';
import { FaHeartbeat, FaPiggyBank, FaUserGraduate, FaUsers, FaBriefcase, FaStar } from 'react-icons/fa';

const categoryIconMap = {
    HEALTH: <FaHeartbeat />,
    FINANCE: <FaPiggyBank />,
    PERSONAL_DEV: <FaUserGraduate />,
    RELATIONSHIPS: <FaUsers />,
    CAREER: <FaBriefcase />,
    OTHER: <FaStar />
};

export const getCategoryIcon = (category) => {
    return categoryIconMap[category] || <FaStar />;
};

// --- CORRECCIÓN: Nombres de clase estandarizados a camelCase ---
const statusInfoMap = {
    PENDING: { key: 'status.pending', className: 'statusPending' },
    IN_PROGRESS: { key: 'status.inProgress', className: 'statusInProgress' }, // <-- Asegurarse que es 'statusInProgress'
    COMPLETED: { key: 'status.completed', className: 'statusCompleted' },
    ARCHIVED: { key: 'status.archived', className: 'statusArchived' },
    FAILED: { key: 'status.failed', className: 'statusFailed' }
};

export const getStatusInfo = (status, t) => {
    // Si el estado no está en el mapa, crea un fallback
    const info = statusInfoMap[status] || { 
        key: `status.${status?.toLowerCase()}`, 
        // Genera la clase dinámicamente: 'status' + 'In_progress' -> 'statusInProgress'
        className: `status${status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase())}`
    };
    
    return {
        translatedStatus: t(info.key, status), // Traduce
        statusClassName: info.className // Devuelve el nombre de la clase
    };
};