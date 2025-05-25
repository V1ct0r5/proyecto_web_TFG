import React from 'react';
import styles from './ConfirmationDialog.module.css';
import Button from './Button'; // Asumiendo que tienes un componente Button en esta ruta

function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}> {/* Evita cerrar al hacer clic dentro */}
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <Button onClick={onClose} variant="secondary">
                        {cancelText}
                    </Button>
                    <Button onClick={onConfirm} variant="destructive">
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;