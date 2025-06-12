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

    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        mode: "onBlur"
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { login: contextLogin } = useAuth();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const responseData = await api.login({
                email: data.email,
                password: data.password,
            });

            if (responseData.token && responseData.user) {
                contextLogin(responseData.token, responseData.user);
                toast.success(t('loginForm.welcomeBack', { user: responseData.user.username }));

                const from = location.state?.from?.pathname;
                const isValidRedirect = from && from !== '/login' && from !== '/register';
                navigate(isValidRedirect ? from : (responseData.user.hasObjectives ? "/dashboard" : "/objectives"), { replace: true });
            }
        } catch (error) {
            if (error.status === 401 || error.status === 400) {
                setError("password", { type: "server", message: t('loginForm.errors.incorrectCredentials') });
            } else {
                toast.error(error.message || t('loginForm.errors.defaultLoginError'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup label={t('common.emailLabel')} htmlFor="login-email" required error={errors.email?.message}>
                <Input
                    type="email"
                    id="login-email"
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

            <FormGroup label={t('common.passwordLabel')} htmlFor="login-password" required error={errors.password?.message}>
                <Input
                    type="password"
                    id="login-password"
                    autoComplete="current-password"
                    placeholder={t('common.passwordPlaceholder')}
                    {...register("password", { required: t('formValidation.passwordRequired') })}
                    disabled={isSubmitting}
                    isError={!!errors.password}
                />
            </FormGroup>

            <Button type="submit" disabled={isSubmitting} variant="primary" style={{ width: '100%' }}>
                {isSubmitting ? <LoadingSpinner size="small" /> : t('loginForm.submitButton')}
            </Button>
        </form>
    );
}

export default LoginForm;