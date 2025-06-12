import React, { useEffect, useRef } from 'react';
import styles from './ConfirmationDialog.module.css';
import Button from './Button';
import { useTranslation } from 'react-i18next';

/**
 * Un diálogo modal accesible para confirmar acciones del usuario.
 * Implementa "focus trapping" y cierre con la tecla Escape.
 * @param {boolean} isOpen - Controla la visibilidad del diálogo.
 * @param {function} onClose - Función a llamar para cerrar el diálogo.
 * @param {function} onConfirm - Función a llamar cuando el usuario confirma la acción.
 * @param {string} title - El título del diálogo.
 * @param {string} message - El mensaje o pregunta del diálogo.
 */

function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    confirmButtonVariant = "primary",
    cancelButtonVariant = "secondary"
}) {
    const { t } = useTranslation();
    const dialogRef = useRef(null);
    const confirmButtonRef = useRef(null); 
    const previouslyFocusedElementRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            previouslyFocusedElementRef.current = document.activeElement;
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        let focusableElements = [];
        let firstFocusableElement = null;
        let lastFocusableElement = null;

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            if (dialogRef.current) {
                const firstButtonInDialog = dialogRef.current.querySelector('button');
                if (firstButtonInDialog) {
                    firstButtonInDialog.focus();
                } else {
                    dialogRef.current.setAttribute('tabindex', '-1');
                    dialogRef.current.focus();
                }
                focusableElements = Array.from(dialogRef.current.querySelectorAll(focusableElementsString));
                if (focusableElements.length > 0) {
                    firstFocusableElement = focusableElements[0];
                    lastFocusableElement = focusableElements[focusableElements.length - 1];
                }
            }
        }

        const handleTabKey = (event) => {
            if (event.key === 'Tab' && isOpen && dialogRef.current) {
                if (focusableElements.length === 0) {
                    event.preventDefault();
                    return;
                }
                if (event.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleTabKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.removeEventListener('keydown', handleTabKey);
            if (previouslyFocusedElementRef.current) {
                previouslyFocusedElementRef.current.focus();
            }
        };
    }, [isOpen, onClose]); 


    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={styles.overlay}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            aria-describedby="dialogMessage"
        >
            <div
                ref={dialogRef}
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="dialogTitle" className={styles.title}>{title || t('confirmationDialog.defaultTitle')}</h3>
                <p id="dialogMessage" className={styles.message}>{message || t('confirmationDialog.defaultMessage')}</p>
                <div className={styles.actions}>
                    <Button
                        onClick={onClose}
                        variant={cancelButtonVariant}
                    >
                        {cancelText || t('common.cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant={confirmButtonVariant}
                        ref={confirmButtonRef}
                    >
                        {confirmText || t('common.confirm')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;