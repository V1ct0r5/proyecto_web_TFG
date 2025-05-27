import React, { useEffect, useRef } from 'react'; // useCallback no se usa explícitamente en la versión limpia final.
import styles from './ConfirmationDialog.module.css';
import Button from './Button';

function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Acción",
    message = "¿Estás seguro de que deseas realizar esta acción?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmButtonVariant = "primary",
    cancelButtonVariant = "secondary"
}) {
    const dialogRef = useRef(null);
    // Ref para el botón de confirmación, puede usarse para el foco inicial si se desea una lógica más específica
    const confirmButtonRef = useRef(null); 
    const previouslyFocusedElementRef = useRef(null);

    // Guardar el elemento que tenía el foco cuando el diálogo se abre
    useEffect(() => {
        if (isOpen) {
            previouslyFocusedElementRef.current = document.activeElement;
        }
    }, [isOpen]);

    // Manejar foco, tecla Escape
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
            // Considerar deshabilitar el scroll del body: document.body.style.overflow = 'hidden';

            if (dialogRef.current) {
                // Enfocar el primer botón del diálogo como comportamiento por defecto.
                // Una lógica más avanzada podría enfocar el botón de cancelar si la acción es destructiva.
                const firstButtonInDialog = dialogRef.current.querySelector('button');
                if (firstButtonInDialog) {
                    firstButtonInDialog.focus();
                } else {
                    // Si no hay botones, hacer el diálogo enfocable para atrapar el foco.
                    dialogRef.current.setAttribute('tabindex', '-1');
                    dialogRef.current.focus();
                }

                // Configurar trampa de foco
                focusableElements = Array.from(dialogRef.current.querySelectorAll(focusableElementsString));
                if (focusableElements.length > 0) {
                    firstFocusableElement = focusableElements[0];
                    lastFocusableElement = focusableElements[focusableElements.length - 1];
                }
            }
        }

        const handleTabKey = (event) => {
            if (event.key === 'Tab' && isOpen && dialogRef.current) {
                if (focusableElements.length === 0) { // No hay elementos enfocables dentro del diálogo
                    event.preventDefault();
                    return;
                }
                if (event.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        event.preventDefault();
                    }
                } else { // Tab
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
            // Considerar restaurar el scroll del body: document.body.style.overflow = 'unset';

            if (previouslyFocusedElementRef.current) {
                previouslyFocusedElementRef.current.focus();
            }
        };
    // Las dependencias como confirmButtonVariant, cancelText, confirmText se eliminaron del array 
    // porque la lógica de foco inicial compleja que dependía de ellas se simplificó.
    // Si se reintroduce esa lógica, deberían volver a añadirse.
    }, [isOpen, onClose]); 


    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={styles.overlay}
            onClick={onClose} // Cierra al hacer clic en el overlay
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            aria-describedby="dialogMessage"
        >
            <div
                ref={dialogRef} // Ref para el manejo de la trampa de foco
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic DENTRO del diálogo
            >
                <h3 id="dialogTitle" className={styles.title}>{title}</h3>
                <p id="dialogMessage" className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <Button
                        onClick={onClose}
                        variant={cancelButtonVariant}
                        // Se podría asignar una ref aquí si el botón de cancelar necesita ser enfocado programáticamente
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant={confirmButtonVariant}
                        ref={confirmButtonRef} // Esta ref se puede usar para enfocar el botón de confirmar si es necesario
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;