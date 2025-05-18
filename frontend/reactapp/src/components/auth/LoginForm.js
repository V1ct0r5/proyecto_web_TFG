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
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const response = await api.login({
                correo_electronico: data.email,
                contrasena: data.password,
            });

            login(response.data.token, response.data.usuario);

            toast.success('¡Bienvenido!');

            navigate("/objectives");

        } catch (err) {
            console.error(
                "Error al iniciar sesión:",
                err.response ? err.response.data : err.message
            );
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

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