import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/apiService";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';

import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";

// Componente del formulario de registro de usuarios
function RegistroForm() {
    // Estados locales para manejar mensajes de error, éxito y estado de carga
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // Hook de react-router-dom para la navegación programática
    const navigate = useNavigate();
    // Hook del contexto de autenticación para acceder a la función de login
    const { login } = useAuth();

    // Inicialización de react-hook-form para manejar el estado del formulario, validaciones y observar campos
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch // Permite observar el valor de los campos del formulario
    } = useForm();

    // Observa el valor del campo 'password' para la validación de confirmar contraseña
    const password = watch("password", "");

    // Función que se ejecuta al enviar el formulario si la validación es exitosa
    const onSubmit = async (data) => {
        // Limpia mensajes de error y éxito previos
        setError(null);
        setSuccess(null);
        // Activa el estado de carga
        setLoading(true);

        // Prepara los datos del usuario a enviar a la API
        const userData = {
            nombre_usuario: data.username,
            correo_electronico: data.email,
            contrasena: data.password,
            confirmar_contrasena: data.confirmPassword,
        };

        try {
            // Llama al servicio de API para registrar un nuevo usuario
            const result = await api.register(userData);

            // Si el registro es exitoso (la respuesta contiene token y user)
            if (result?.token && result?.user) {
                // Inicia sesión automáticamente con los datos recibidos
                login(result.token, result.user);
                // Muestra un mensaje de éxito
                toast.success("Registro exitoso. Redirigiendo...");
                // Limpia el estado de error local
                setError(null);

                // Redirige a la página para crear el primer objetivo
                navigate("/objectives");

            } else {
                // Maneja respuestas inesperadas del servidor
                setError("Error inesperado en la respuesta del servidor.");
                toast.error("Error en la respuesta del servidor.");
            }

        } catch (err) {
            // Manejo de errores durante el registro
            console.error('Error al intentar registrar:', err);

            let errorMessage = "Error de red o del servidor al intentar registrar. Por favor, inténtalo de nuevo.";

            // Determina el mensaje de error a mostrar basándose en la respuesta del servidor
            if (err.response && err.response.status === 409) { // Conflicto (correo ya registrado)
                errorMessage = err.response.data && err.response.data.message
                    ? err.response.data.message
                    : "El correo electrónico ya está registrado.";
            } else if (err.response && err.response.data) { // Otros errores del servidor
                if (
                    err.response.data.errors && // Errores de validación detallados de express-validator (código backend)
                    Array.isArray(err.response.data.errors)
                ) {
                    errorMessage =
                        "Errores de validación: " +
                        err.response.data.errors
                            .map((e) => e.msg || e.message || "desconocido") // Mapea los mensajes de error
                            .join(", ");
                } else if (err.response.data.message) { // Mensaje de error general del servidor
                    errorMessage = err.response.data.message;
                } else { // Formato de error desconocido del servidor
                    errorMessage = "Error del servidor: Formato de error desconocido.";
                }
            } else if (err.message) { // Errores de red o de Axios antes de recibir respuesta
                errorMessage = "Error de conexión: " + err.message;
            }

            // Establece el estado de error local y muestra el toast con el mensaje
            setError(errorMessage);
            toast.error(errorMessage);
            // Limpia el estado de éxito local
            setSuccess(null);

        } finally {
            // Desactiva el estado de carga al finalizar la solicitud (éxito o error)
            setLoading(false);
        }
    };

    // Renderizado del formulario
    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup
                label="Nombre de Usuario"
                htmlFor="username"
                required={true}
                error={errors.username?.message}
            >
                <Input
                    type="text"
                    id="username"
                    placeholder="Tu nombre de usuario"
                    {...register("username", {
                        required: "El nombre de usuario es obligatorio",
                        minLength: { value: 3, message: "El nombre de usuario debe tener al menos 3 caracteres" }
                    })}
                    disabled={loading}
                    isError={!!errors.username}
                />
            </FormGroup>
            <FormGroup
                label="Correo electrónico"
                htmlFor="email"
                required={true}
                error={errors.email?.message}
            >
                <Input
                    type="email"
                    id="email"
                    placeholder="tu@correo.com"
                    {...register("email", {
                        required: "El correo electrónico es obligatorio",
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Formato de correo electrónico no válido"
                        }
                    })}
                    disabled={loading}
                    isError={!!errors.email}
                />
            </FormGroup>
            <FormGroup
                label="Contraseña"
                htmlFor="password"
                required={true}
                error={errors.password?.message}
            >
                <Input
                    type="password"
                    id="password"
                    placeholder="Tu contraseña"
                    {...register("password", {
                        required: "La contraseña es obligatoria",
                        minLength: {
                            value: 8, // Validar longitud mínima consistente con backend
                            message: "La contraseña debe tener al menos 8 caracteres"
                        },
                        validate: {
                            hasUppercase: (value) =>
                                /[A-Z]/.test(value) || "La contraseña debe contener al menos una mayúscula",
                            hasLowercase: (value) =>
                                /[a-z]/.test(value) || "La contraseña debe contener al menos una minúscula",
                            hasNumber: (value) =>
                                /[0-9]/.test(value) || "La contraseña debe contener al menos un número",
                            hasSpecialChar: (value) =>
                                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(value) ||
                                "La contraseña debe contener al menos un carácter especial"
                        }
                    })}
                    disabled={loading}
                    isError={!!errors.password}
                />
            </FormGroup>
            <FormGroup
                label="Confirmar Contraseña"
                htmlFor="confirmPassword"
                required={true}
                error={errors.confirmPassword?.message}
            >
                <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirma tu contraseña"
                    {...register("confirmPassword", {
                        required: "Por favor, confirma tu contraseña",
                        // Validación custom para que coincida con el campo 'password' observado
                        validate: value => value.trim() === password.trim() || "Las contraseñas no coinciden"
                    })}
                    disabled={loading}
                    isError={!!errors.confirmPassword}
                />
            </FormGroup>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <Button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
            {loading && (
                <div className="loading-overlay">
                    <p>Cargando...</p>
                </div>
            )}
        </form>
    );
}

export default RegistroForm;