import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/apiService";
import { useForm } from "react-hook-form";

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

    const password = watch("contrasena", "");

    const onSubmit = async (data) => {
        setError("");
        setSuccess("");
        setLoading(true);

        const userData = {
            nombre_usuario: data.username,
            correo_electronico: data.email,
            contrasena: data.password,
            confirmar_contrasena: data.confirmPassword,
        };

        try {
            const response = await api.register(userData);

            setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");
            console.log("Registro exitoso:", response.data);

            const { token, usuario } = response.data;
            if (token) {
                console.log("Token recibido en el registro. Iniciando sesión automáticamente.");
                login(token, usuario);
                navigate('/objectives');
            } else {
                setTimeout(() => { navigate('/login'); }, 2000);
            }

        } catch (err) {
            console.error("Error al registrar:", err);
            if (err.response && err.response.data) {
                if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    setError("Errores de validación: " + err.response.data.errors.map(e => e.msg || e.message || 'Error de validación desconocido').join(", "));
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else if (err.response.data.error) {
                    setError(err.response.data.error);
                } else { setError("Error desconocido en el registro."); }
            } else {
                setError("Error de red o del servidor al intentar registrar. Por favor, inténtalo de nuevo.");
            }
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
                            value: 6,
                            message: "La contraseña debe tener al menos 6 caracteres"
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
                        validate: value => value === password || "Las contraseñas no coinciden"
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