import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

import api from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";

function RegistroForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login: contextLogin } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setError
    } = useForm({
        mode: "onBlur"
    });

    const watchedPassword = watch("password", "");

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {
            const responseData = await api.register({
                nombre_usuario: data.username,
                correo_electronico: data.email,
                contrasena: data.password,
                confirmar_contrasena: data.confirmPassword
            });

            toast.success(t('registroForm.success'));

            if (responseData && responseData.token && responseData.id && responseData.nombre_usuario && responseData.correo_electronico) {
                const userForContext = {
                    id: responseData.id,
                    nombre_usuario: responseData.nombre_usuario,
                    correo_electronico: responseData.correo_electronico,
                };
                contextLogin(responseData.token, userForContext);
                navigate("/dashboard", { replace: true });
            } else {
                toast.error(t('registroForm.errors.autoLoginFailed'));
                navigate("/login");
            }

        } catch (error) {
            const displayMessage = error.data?.message || error.message || t('registroForm.errors.defaultRegisterError');
            toast.error(displayMessage);

            if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
                error.data.errors.forEach(err => {
                    const fieldName = err.param || err.path;
                    const clientFieldName = fieldName === 'nombre_usuario' ? 'username' :
                                           fieldName === 'correo_electronico' ? 'email' :
                                           fieldName === 'contrasena' ? 'password' : fieldName;
                    if (clientFieldName && typeof setError === 'function') {
                        setError(clientFieldName, { type: "server", message: err.msg || t('common.serverError') });
                    }
                });
            } else if (error.status === 409) {
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
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup label={t('common.usernameLabel')} htmlFor="register-username" required error={errors.username?.message}>
                <Input
                    type="text"
                    id="register-username"
                    placeholder={t('common.usernamePlaceholder')}
                    {...register("username", {
                        required: t('formValidation.usernameRequired'),
                        minLength: { value: 3, message: t('formValidation.minLength', { count: 3 }) },
                        maxLength: { value: 50, message: t('formValidation.maxLength', { count: 50 }) },
                        pattern: { value: /^[a-zA-Z0-9_.-]+$/, message: t('formValidation.usernamePattern') }
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.username}
                    aria-invalid={errors.username ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label={t('common.emailLabel')} htmlFor="register-email" required error={errors.email?.message}>
                <Input
                    type="email"
                    id="register-email"
                    placeholder={t('common.emailPlaceholderExample')}
                    {...register("email", {
                        required: t('formValidation.emailRequired'),
                        pattern: { value: /^\S+@\S+\.\S+$/i, message: t('formValidation.emailInvalid') },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.email}
                    aria-invalid={errors.email ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label={t('common.passwordLabel')} htmlFor="register-password" required error={errors.password?.message}>
                <Input
                    type="password"
                    id="register-password"
                    placeholder={t('common.passwordPlaceholderMinLength', { count: 8 })}
                    autoComplete="new-password"
                    {...register("password", {
                        required: t('formValidation.passwordRequired'),
                        minLength: { value: 8, message: t('formValidation.passwordMinLength', { count: 8 }) },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.password}
                    aria-invalid={errors.password ? "true" : "false"}
                />
            </FormGroup>

            <FormGroup label={t('common.confirmPasswordLabel')} htmlFor="register-confirmPassword" required error={errors.confirmPassword?.message}>
                <Input
                    type="password"
                    id="register-confirmPassword"
                    autoComplete="new-password"
                    placeholder={t('common.confirmPasswordPlaceholder')}
                    {...register("confirmPassword", {
                        required: t('formValidation.confirmPasswordRequired'),
                        validate: value => value === watchedPassword || t('formValidation.passwordsDoNotMatch'),
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.confirmPassword}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" className="full-width-button">
                {isSubmitting ? <LoadingSpinner size="small" color="white" /> : t('registroForm.submitButton')}
            </Button>
        </form>
    );
}

export default RegistroForm;