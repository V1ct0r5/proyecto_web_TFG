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

    const { register, handleSubmit, formState: { errors }, watch, setError } = useForm({
        mode: "onBlur"
    });

    const watchedPassword = watch("password", "");

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const responseData = await api.register({
                username: data.username,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword,
            });

            toast.success(t('registroForm.success'));
            if (responseData.token && responseData.user) {
                contextLogin(responseData.token, responseData.user);
                navigate("/dashboard", { replace: true });
            } else {
                toast.warn(t('registroForm.errors.autoLoginFailed'));
                navigate("/login");
            }
        } catch (error) {
            const displayMessage = error.message || t('registroForm.errors.defaultRegisterError');
            toast.error(displayMessage);
            if (error.data?.errors) {
                error.data.errors.forEach(err => {
                    const fieldName = err.path || 'unknown';
                    setError(fieldName, { type: "server", message: err.msg });
                });
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
                    autoComplete="username"
                    placeholder={t('common.usernamePlaceholder')}
                    {...register("username", {
                        required: t('formValidation.usernameRequired'),
                        minLength: { value: 3, message: t('formValidation.minLength', { count: 3 }) },
                        pattern: { value: /^[a-zA-Z0-9_.-]+$/, message: t('formValidation.usernamePattern') }
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.username}
                />
            </FormGroup>

            <FormGroup label={t('common.emailLabel')} htmlFor="register-email" required error={errors.email?.message}>
                <Input
                    type="email"
                    id="register-email"
                    autoComplete="email"
                    placeholder={t('common.emailPlaceholderExample')}
                    {...register("email", {
                        required: t('formValidation.emailRequired'),
                        pattern: { value: /^\S+@\S+\.\S+$/i, message: t('formValidation.emailInvalid') },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.email}
                />
            </FormGroup>

            <FormGroup label={t('common.passwordLabel')} htmlFor="register-password" required error={errors.password?.message}>
                <Input
                    type="password"
                    id="register-password"
                    autoComplete="new-password"
                    placeholder={t('common.passwordPlaceholderMinLength', { count: 8 })}
                    {...register("password", {
                        required: t('formValidation.passwordRequired'),
                        minLength: { value: 8, message: t('formValidation.passwordMinLength', { count: 8 }) },
                    })}
                    disabled={isSubmitting}
                    isError={!!errors.password}
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
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" style={{ width: '100%' }}>
                {isSubmitting ? <LoadingSpinner size="small" /> : t('registroForm.submitButton')}
            </Button>
        </form>
    );
}

export default RegistroForm;