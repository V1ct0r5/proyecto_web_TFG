import React, { useState } from "react";
import api from "../../services/apiService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import Input from "../ui/Input";
import Button from "../ui/Button";
import FormGroup from "../ui/FormGroup";
import { toast } from 'react-toastify';

function LoginForm() {
    // Estado local para manejar el estado de carga del formulario
    const [loading, setLoading] = useState(false);

    // Inicialización de react-hook-form para manejar el estado del formulario y validaciones
    const {
        register, // Función para registrar inputs
        handleSubmit, // Función para manejar el envío del formulario
        formState: { errors }, // Objeto que contiene los errores de validación
    } = useForm();

    // Hook de react-router-dom para la navegación
    const navigate = useNavigate();
    // Contexto de autenticación para acceder a la función de login
    const { login } = useAuth();

    // Función que se ejecuta al enviar el formulario si la validación es exitosa
    const onSubmit = async (data) => {
        // Activa el estado de carga
        setLoading(true);

        try {
            // Llama al servicio de API para iniciar sesión
            const response = await api.login({
                correo_electronico: data.email,
                contrasena: data.password,
            });

            // Si el inicio de sesión es exitoso, guarda el token y el usuario en el contexto de autenticación
            login(response.data.token, response.data.usuario);
            // Muestra una notificación de éxito
            toast.success('¡Bienvenido!');

            // Navega al dashboard o a la página de creación de objetivos según si el usuario ya tiene objetivos
            if (response.data.hasObjectives) {
                navigate("/dashboard");
            } else {
                navigate("/objectives"); // Redirige a la página para crear el primer objetivo
            }

        } catch (err) {
            // Manejo de errores durante el inicio de sesión
            console.error(
                "Error al iniciar sesión:",
                err.response ? err.response.data : err.message
            );

            // Muestra un mensaje de error al usuario usando toast
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
            }
        } finally {
            // Desactiva el estado de carga al finalizar la solicitud (éxito o error)
            setLoading(false);
        }
    };

    // Renderizado del formulario
    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                            message: "Formato de correo electrónico no válido",
                        },
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
                            message: "La contraseña debe tener al menos 6 caracteres",
                        },
                    })}
                    disabled={loading}
                    isError={!!errors.password}
                />
            </FormGroup>
            <Button type="submit" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
            {loading && (
                <div className="loading-overlay">
                    <p>Cargando...</p>
                </div>
            )}
        </form>
    );
}

export default LoginForm;