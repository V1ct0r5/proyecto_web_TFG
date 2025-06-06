import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import api from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import Input from "../ui/Input";
import Button from "../ui/Button";
import FormGroup from "../ui/FormGroup";
import LoadingSpinner from "../ui/LoadingSpinner";

function LoginForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm({
        mode: "onBlur"
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { login: contextLogin } = useAuth();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const responseData = await api.login({
                correo_electronico: data.email,
                contrasena: data.password,
            });

            if (responseData.token && responseData.usuario) {
                contextLogin(responseData.token, responseData.usuario);
                toast.success(t('loginForm.welcomeBack', { user: responseData.usuario.nombre_usuario }));

                const from = location.state?.from?.pathname;
                const fromIsValidRedirect = from && from !== '/login' && from !== '/register' && from !== '/';

                if (fromIsValidRedirect) {
                    navigate(from, { replace: true });
                } else if (responseData.hasObjectives === false) {
                    navigate("/objectives", { replace: true });
                    toast.info(t('loginForm.createFirstObjective'));
                } else {
                    navigate("/dashboard", { replace: true });
                }
            } else {
                toast.error(t('loginForm.errors.unexpectedResponse'));
            }
        } catch (error) {
            const displayMessage = error.data?.message || error.message || t('loginForm.errors.defaultLoginError');
            if (error.status !== 401 && error.status !== 403) {
                toast.error(displayMessage);
            }
            
            if (error.status === 401 || error.status === 400) {
                if (typeof setError === 'function') {
                    setError("email", { type: "server", message: " " });
                    setError("password", { type: "server", message: t('loginForm.errors.incorrectCredentials') });
                }
            } else if (error.data?.errors && Array.isArray(error.data.errors) && typeof setError === 'function') {
                error.data.errors.forEach(err => {
                    const fieldName = err.path || err.param || (err.field ? err.field.toLowerCase() : null);
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
                label={t('common.emailLabel')}
                htmlFor="login-email"
                required
                error={errors.email?.message}
            >
                <Input
                    type="email"
                    id="login-email"
                    placeholder={t('common.emailPlaceholder')}
                    {...register("email", {
                        required: t('formValidation.emailRequired'),
                        pattern: {
                            value: /^\S+@\S+\.\S+$/i,
                            message: t('formValidation.emailInvalid'),
                        },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.email}
                    aria-invalid={errors.email ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup
                label={t('common.passwordLabel')}
                htmlFor="login-password"
                required
                error={errors.password?.message}
            >
                <Input
                    type="password"
                    id="login-password"
                    placeholder={t('common.passwordPlaceholder')}
                    {...register("password", {
                        required: t('formValidation.passwordRequired'),
                    })}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    isError={!!errors.password}
                    aria-invalid={errors.password ? "true" : "false"}
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" className="full-width-button">
                {isSubmitting ? <LoadingSpinner size="small" color="white" /> : t('loginForm.submitButton')}
            </Button>
        </form>
    );
}

export default LoginForm;