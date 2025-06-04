import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';

import api from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import Input from "../ui/Input";
import Button from "../ui/Button";
import FormGroup from "../ui/FormGroup";
import LoadingSpinner from "../ui/LoadingSpinner";
// import styles from './LoginForm.module.css'; // Activar si se añaden estilos específicos del módulo

function LoginForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError // Para establecer errores provenientes del servidor en campos específicos
    } = useForm({
        mode: "onBlur" // Validar al perder el foco para mejorar UX tras el primer intento de envío
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { login: contextLogin } = useAuth(); // Renombrar para claridad y evitar colisión

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const responseData = await api.login({
                correo_electronico: data.email,
                contrasena: data.password,
            });

            if (responseData.token && responseData.usuario) {
                contextLogin(responseData.token, responseData.usuario);
                toast.success(`¡Bienvenido de nuevo, ${responseData.usuario.nombre_usuario}!`);

                const from = location.state?.from?.pathname;
                // Validar que 'from' no sea una ruta de autenticación o la raíz para evitar bucles/redirecciones no deseadas
                const fromIsValidRedirect = from && from !== '/login' && from !== '/register' && from !== '/';

                if (fromIsValidRedirect) {
                    navigate(from, { replace: true });
                } else if (responseData.hasObjectives === false) { // Redirigir a crear objetivo si es un usuario nuevo sin objetivos
                    navigate("/objectives", { replace: true });
                    toast.info("¡Comencemos creando tu primer objetivo!");
                } else {
                    navigate("/dashboard", { replace: true });
                }
            } else {
                // Manejo de respuestas exitosas (2xx) pero inesperadas del servidor (sin token/usuario)
                toast.error("Respuesta inesperada del servidor al iniciar sesión. Inténtalo de nuevo.");
            }
        } catch (error) {
            // apiService ya debería haber formateado el error y mostrado un toast genérico si es 401/403 no login
            const displayMessage = error.data?.message || error.message || "Error al iniciar sesión. Verifica tus credenciales.";
            if (error.status !== 401 && error.status !== 403) { // Evitar doble toast si apiService ya mostró uno por 401/403 de sesión expirada
                toast.error(displayMessage);
            }
            
            // Marcar campos como erróneos en el formulario si el backend devuelve errores específicos
            if (error.status === 401 || error.status === 400) { // Errores comunes para credenciales incorrectas
                if (typeof setError === 'function') {
                    setError("email", { type: "server", message: " " }); // Mensaje vacío para el campo, el toast general ya informa
                    setError("password", { type: "server", message: "Credenciales incorrectas." });
                }
            } else if (error.data?.errors && Array.isArray(error.data.errors) && typeof setError === 'function') {
                // Mapeo de errores de validación del backend a campos del formulario
                error.data.errors.forEach(err => {
                    const fieldName = err.path || err.param || (err.field ? err.field.toLowerCase() : null);
                    // Mapeo específico si el nombre del campo del backend difiere del nombre en react-hook-form
                    const reactHookFormField = fieldName === 'correo_electronico' ? 'email' : fieldName;
                    if (reactHookFormField) {
                        setError(reactHookFormField, { type: "server", message: err.msg || err.message });
                    }
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup
                label="Correo Electrónico"
                htmlFor="login-email"
                required
                error={errors.email?.message}
            >
                <Input
                    type="email"
                    id="login-email"
                    placeholder="tu@email.com"
                    {...register("email", {
                        required: "El correo electrónico es obligatorio.",
                        pattern: {
                            value: /^\S+@\S+\.\S+$/i,
                            message: "Formato de correo electrónico no válido.",
                        },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.email}
                    aria-invalid={errors.email ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup
                label="Contraseña"
                htmlFor="login-password"
                required
                error={errors.password?.message}
            >
                <Input
                    type="password"
                    id="login-password"
                    placeholder="Tu contraseña"
                    {...register("password", {
                        required: "La contraseña es obligatoria.",
                        // Validación de longitud mínima usualmente se maneja en el registro o backend
                    })}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    isError={!!errors.password}
                    aria-invalid={errors.password ? "true" : "false"}
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" className="full-width-button">
                {isSubmitting ? <LoadingSpinner size="small" color="white" /> : "Iniciar sesión"}
            </Button>
        </form>
    );
}

export default LoginForm;