import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/apiService";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';

import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";


function RegistroForm() {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const { register, handleSubmit, formState: { errors }, watch } = useForm();

    const password = watch("password", "");

    const onSubmit = async (data) => {

        setError(null);
        setSuccess(null);
        setLoading(true);

        const userData = {
            nombre_usuario: data.username,
            correo_electronico: data.email,
            contrasena: data.password,
            confirmar_contrasena: data.confirmPassword,
        };

        try {
            const result = await api.register(userData);

            if (result?.token && result?.user) {
                login(result.token, result.user);
                setSuccess("Registro exitoso. Redirigiendo...");
                setError(null);

                navigate("/objectives");

            } else {
                setError("Error inesperado en la respuesta del servidor.");
                toast.error("Error en la respuesta del servidor.");
            }

        } catch (err) {
            console.error('Error al intentar registrar:', err);

            let errorMessage = "Error de red o del servidor al intentar registrar. Por favor, inténtalo de nuevo.";

            if (err.response && err.response.status === 409) {
                errorMessage = err.response.data && err.response.data.message
                    ? err.response.data.message
                    : "El correo electrónico ya está registrado.";
            } else if (err.response && err.response.data) {
                if (
                    err.response.data.errors &&
                    Array.isArray(err.response.data.errors)
                ) {
                    errorMessage =
                        "Errores de validación: " +
                        err.response.data.errors
                            .map((e) => e.msg || e.message || "desconocido")
                            .join(", ");
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else {
                    errorMessage = "Error del servidor: Formato de error desconocido.";
                }
            } else if (err.message) {
                errorMessage = "Error de conexión: " + err.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);

        } finally {
            setLoading(false);
        }
    };


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
                            value: 8,
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
        </form>
    );
}

export default RegistroForm;