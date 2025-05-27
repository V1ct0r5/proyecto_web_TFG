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
// import styles from './LoginForm.module.css'; // Descomentar si se usan estilos específicos

function LoginForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError // Para establecer errores de servidor en campos específicos
    } = useForm({
        mode: "onBlur" // Validar al perder el foco después del primer intento de envío
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { login: contextLogin } = useAuth(); // Renombrar para evitar colisión con variables locales

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
                const fromIsValidRedirect = from && from !== '/login' && from !== '/register' && from !== '/';

                if (fromIsValidRedirect) {
                    navigate(from, { replace: true });
                } else if (responseData.hasObjectives === false) {
                    navigate("/objectives", { replace: true });
                    toast.info("¡Comencemos creando tu primer objetivo!");
                } else {
                    navigate("/dashboard", { replace: true });
                }
            } else {
                // Este caso es para respuestas 2xx inesperadas sin token/usuario
                toast.error("Error inesperado del servidor al iniciar sesión. Inténtalo de nuevo.");
            }

        } catch (error) {
            // Asumimos que el interceptor de apiService ya formateó el error
            const displayMessage = error.data?.message || error.message || "Error al iniciar sesión. Verifica tus credenciales.";
            toast.error(displayMessage);
            
            if (error.status === 401 && typeof setError === 'function') { // Credenciales incorrectas
                setError("email", { type: "server", message: " " }); // Mensaje vacío para el campo, el toast ya informa
                setError("password", { type: "server", message: "Credenciales incorrectas." });
            } else if (error.data && error.data.errors && Array.isArray(error.data.errors) && typeof setError === 'function') {
                // Para errores de validación más genéricos (menos común en login)
                error.data.errors.forEach(err => {
                    const field = err.path || err.param;
                    if (field) {
                       setError(field, { type: "server", message: err.msg });
                    }
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate> {/* Considerar className={styles.loginForm} */}
            <FormGroup
                label="Correo Electrónico"
                htmlFor="login-email" // IDs únicos
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
                htmlFor="login-password" // IDs únicos
                required
                error={errors.password?.message}
            >
                <Input
                    type="password"
                    id="login-password"
                    placeholder="Tu contraseña"
                    {...register("password", {
                        required: "La contraseña es obligatoria.",
                        // No se suele validar longitud mínima en el login frontend
                    })}
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