import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';

import api from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
// import styles from './RegistroForm.module.css'; // Descomentar si se crean estilos específicos

function RegistroForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login: contextLogin } = useAuth(); // Renombrado para evitar colisión con alguna función 'login' local si existiera

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setError // Para establecer errores provenientes del servidor en campos específicos
    } = useForm({
        mode: "onBlur" // Valida los campos cuando pierden el foco, después del primer intento de submit
    });

    const watchedPassword = watch("password", ""); // Observar el valor del campo 'password'

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {
            const responseData = await api.register({
                nombre_usuario: data.username,
                correo_electronico: data.email,
                contrasena: data.password,
                // confirmar_contrasena no se envía al backend
            });

            toast.success("¡Registro completado con éxito! Iniciando sesión...");

            // Verificar que la respuesta del backend contenga la información necesaria
            if (responseData && responseData.token && responseData.id && responseData.nombre_usuario && responseData.correo_electronico) {
                const userForContext = {
                    id: responseData.id,
                    nombre_usuario: responseData.nombre_usuario,
                    correo_electronico: responseData.correo_electronico,
                    // Considerar añadir otros campos del usuario que el AuthContext espere
                };
                contextLogin(responseData.token, userForContext);
                navigate("/dashboard", { replace: true }); // Redirigir al dashboard principal
            } else {
                toast.error("Registro exitoso, pero hubo un problema al iniciar sesión automáticamente. Por favor, intenta iniciar sesión manualmente.");
                navigate("/login"); // Fallback a la página de login
            }

        } catch (error) {
            // Asumimos que apiService ya ha formateado 'error' para tener error.data y error.status
            const displayMessage = error.data?.message || error.message || "Error durante el registro. Por favor, inténtalo de nuevo.";
            toast.error(displayMessage);

            // Mapear errores de validación del backend a campos específicos del formulario
            if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
                error.data.errors.forEach(err => {
                    const fieldName = err.param || err.path; // 'param' es común en express-validator
                    // Mapeo de nombres de campo del backend a los del frontend
                    const clientFieldName = fieldName === 'nombre_usuario' ? 'username' :
                                           fieldName === 'correo_electronico' ? 'email' :
                                           fieldName === 'contrasena' ? 'password' : fieldName;
                    if (clientFieldName && typeof setError === 'function') {
                        setError(clientFieldName, { type: "server", message: err.msg || "Error del servidor" });
                    }
                });
            } else if (error.status === 409) { // Conflicto (ej. email o username ya existen)
                if (displayMessage.toLowerCase().includes('correo') || displayMessage.toLowerCase().includes('email')) {
                   if (typeof setError === 'function') setError("email", { type: "server", message: displayMessage });
                } else if (displayMessage.toLowerCase().includes('nombre de usuario') || displayMessage.toLowerCase().includes('username')) {
                   if (typeof setError === 'function') setError("username", { type: "server", message: displayMessage });
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate> {/* className={styles.registroForm} si se usa */}
            <FormGroup label="Nombre de Usuario" htmlFor="register-username" required error={errors.username?.message}>
                <Input
                    type="text"
                    id="register-username"
                    placeholder="Tu nombre de usuario"
                    {...register("username", {
                        required: "El nombre de usuario es obligatorio.",
                        minLength: { value: 3, message: "Mínimo 3 caracteres." },
                        maxLength: { value: 50, message: "Máximo 50 caracteres." },
                        pattern: { value: /^[a-zA-Z0-9_.-]+$/, message: "Solo letras, números, y los caracteres . _ -" }
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.username}
                    aria-invalid={errors.username ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label="Correo Electrónico" htmlFor="register-email" required error={errors.email?.message}>
                <Input
                    type="email"
                    id="register-email"
                    placeholder="tu.email@ejemplo.com"
                    {...register("email", {
                        required: "El correo electrónico es obligatorio.",
                        pattern: { value: /^\S+@\S+\.\S+$/i, message: "Formato de correo electrónico no válido." },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.email}
                    aria-invalid={errors.email ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label="Contraseña" htmlFor="register-password" required error={errors.password?.message}>
                <Input
                    type="password"
                    id="register-password"
                    placeholder="Mínimo 8 caracteres" // Ajustar si las reglas de backend son más estrictas
                    {...register("password", {
                        required: "La contraseña es obligatoria.",
                        minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres." },
                        // Las validaciones de complejidad (mayúsculas, etc.) se omiten aquí,
                        // asumiendo que el backend las maneja. Si se añaden, deben ser consistentes.
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.password}
                    aria-invalid={errors.password ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label="Confirmar Contraseña" htmlFor="register-confirmPassword" required error={errors.confirmPassword?.message}>
                <Input
                    type="password"
                    id="register-confirmPassword"
                    placeholder="Repite tu contraseña"
                    {...register("confirmPassword", {
                        required: "Por favor, confirma tu contraseña.",
                        validate: value => value === watchedPassword || "Las contraseñas no coinciden.",
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.confirmPassword}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" className="full-width-button"> {/* Asumiendo variantes y clase global/de botón */}
                {isSubmitting ? <LoadingSpinner size="small" color="white" /> : 'Crear cuenta'}
            </Button>
        </form>
    );
}

export default RegistroForm;