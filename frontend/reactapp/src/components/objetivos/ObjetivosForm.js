import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css";
import DatePicker from '../ui/DatePicker/DatePicker';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

function ObjectiveForm({
    initialData = null,
    onSubmit: handleFormSubmit,
    buttonText,
    isFirstObjective = false,
    isEditMode = false,
    onCancel
}) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, dirtyFields },
        reset,
        watch,
        control,
    } = useForm({
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            category: initialData?.category || '',
            targetValue: initialData?.targetValue !== undefined ? initialData.targetValue : '',
            initialValue: initialData?.initialValue !== undefined ? initialData.initialValue : '',
            currentValue: initialData?.currentValue !== undefined ? initialData.currentValue : '',
            unit: initialData?.unit || '',
            startDate: initialData?.startDate && isValid(parseISO(initialData.startDate)) ? parseISO(initialData.startDate) : null,
            endDate: initialData?.endDate && isValid(parseISO(initialData.endDate)) ? parseISO(initialData.endDate) : null,
            status: initialData?.status || 'PENDING',
            isLowerBetter: initialData?.isLowerBetter === true,
        }
    });

    const startDateValue = watch("startDate");
    const targetValueWatch = watch("targetValue");

    const categoryKeyMap = {
        'HEALTH': "health",
        'FINANCE': "finance",
        'PERSONAL_DEV': "personalDevelopment",
        'RELATIONSHIPS': "relationships",
        'CAREER': "career",
        'OTHER': "other",
    };

    const statusKeyMap = {
        'PENDING': "pending",
        'IN_PROGRESS': "inProgress",
        'COMPLETED': "completed",
        'ARCHIVED': "archived",
        'FAILED': "failed",
    };

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                description: initialData.description || '',
                category: initialData.category || '',
                targetValue: initialData.targetValue !== undefined ? initialData.targetValue : '',
                initialValue: initialData.initialValue !== undefined ? initialData.initialValue : '',
                currentValue: initialData.currentValue !== undefined ? initialData.currentValue : '',
                unit: initialData.unit || '',
                startDate: initialData.startDate && isValid(parseISO(initialData.startDate)) ? parseISO(initialData.startDate) : null,
                endDate: initialData.endDate && isValid(parseISO(initialData.endDate)) ? parseISO(initialData.endDate) : null,
                status: initialData.status || 'PENDING',
                isLowerBetter: initialData.isLowerBetter === true,
            });
        } else {
            reset({
                name: '',
                description: '',
                category: '',
                targetValue: '',
                initialValue: '',
                currentValue: '',
                unit: '',
                startDate: null,
                endDate: null,
                status: 'PENDING',
                isLowerBetter: false,
            });
        }
    }, [initialData, reset]);

    const onSubmitInternal = async (data) => {
        setLoading(true);

        const isQuantitative = data.targetValue !== '' && data.targetValue !== null;

    // --- CORRECCIÓN DEL PAYLOAD ---
    // Construimos el payload solo con lo necesario
    const payload = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        unit: data.unit || null,
        startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
        endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
        isLowerBetter: data.isLowerBetter,
        // Valores cuantitativos solo si es de ese tipo
        initialValue: isQuantitative ? parseFloat(data.initialValue || 0) : null,
        targetValue: isQuantitative ? parseFloat(data.targetValue) : null,
    };
        
        // El caso especial: progressData solo se añade si 'currentValue' ha sido modificado
        if (isEditMode && dirtyFields.currentValue) {
            payload.progressData = {
                value: isQuantitative ? parseFloat(data.currentValue) : 0,
                notes: 'Valor actualizado desde la pantalla de edición.'
            };
        } else if (!isEditMode) {
             // En modo creación, siempre se envían estos valores
            payload.initialValue = isQuantitative ? parseFloat(data.initialValue) : null;
            payload.currentValue = payload.initialValue;
            // Pasamos el resto de los datos que no están en dirtyFields pero son necesarios
            payload.name = data.name;
            payload.category = data.category;
        }

        // Si no hay campos modificados, no hacemos nada (excepto si es creación)
        if (isEditMode && Object.keys(payload).length === 0) {
            toast.info("No se han detectado cambios.");
            setLoading(false);
            return;
        }

        try {
            await handleFormSubmit(isEditMode ? { id: initialData?.id, ...payload } : payload);
            if (!isEditMode) {
                reset({
                    name: '', description: '', category: '', targetValue: '',
                    initialValue: '', currentValue: '', unit: '',
                    startDate: null, endDate: null, status: 'PENDING', isLowerBetter: false,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel();
        } else {
            reset();
            toast.info(t('objectivesForm.formCleared'));
        }
    };

    const finalButtonText = buttonText || (isEditMode ? t('objectivesForm.updateButton') : t('objectivesForm.createButton'));

    const buttonContainerClass = [objetivosStyles.buttonContainer];
    if (isEditMode || !isFirstObjective) {
        buttonContainerClass.push(objetivosStyles.buttonsWithCancel);
    } else {
        buttonContainerClass.push(objetivosStyles.firstObjectiveButtons);
    }

    return (
        <div className={objetivosStyles.formContainer}>
            <form onSubmit={handleSubmit(onSubmitInternal)} noValidate>
                <div className={objetivosStyles.formGroupContainer}>
                    <FormGroup label={t('objectivesForm.nameLabel')} htmlFor="name" required={true} error={errors.name?.message}>
                        <Input
                            data-cy="objective-name-input" type="text" id="name" placeholder={t('objectivesForm.namePlaceholder')}
                            {...register("name", {
                                required: t('formValidation.nameRequired'),
                                minLength: { value: 3, message: t('formValidation.nameMinLength', { count: 3 }) },
                            })}
                            disabled={loading} isError={!!errors.name}
                        />
                    </FormGroup>

                    <FormGroup label={t('objectivesForm.descriptionLabel')} htmlFor="description" error={errors.description?.message}>
                        <Input
                            data-cy="objective-description-input" type="textarea" id="description" placeholder={t('objectivesForm.descriptionPlaceholder')}
                            {...register("description")}
                            disabled={loading} isError={!!errors.description}
                        />
                    </FormGroup>

                    <FormGroup label={t('objectivesForm.typeLabel')} htmlFor="category" required={true} error={errors.category?.message}>
                        <Input
                            data-cy="objective-category-select" type="select" id="category"
                            {...register("category", {
                                required: t('formValidation.typeRequired'),
                                validate: (value) => value !== "" || t('formValidation.typeRequired'),
                            })}
                            disabled={loading} isError={!!errors.category}
                        >
                            <option value="" disabled>{t('objectivesForm.selectType')}</option>
                            {Object.entries(categoryKeyMap).map(([key, value]) => (
                                <option key={key} value={key}>{t(`categories.${value}`)}</option>
                            ))}
                        </Input>
                    </FormGroup>

                    <div className={objetivosStyles.formGrid}>
                        {!isEditMode && (
                            <FormGroup label={t('objectivesForm.initialValueLabel')} htmlFor="initialValue" required={true} error={errors.initialValue?.message}>
                                <Input
                                    data-cy="objective-initial-value-input" type="number" id="initialValue" step="any" placeholder="Ej. 78"
                                    {...register("initialValue", {
                                        valueAsNumber: true,
                                        required: t('formValidation.initialValueRequired'),
                                        min: { value: 0, message: t('formValidation.initialValuePositive') },
                                        validate: (value) => value === '' || value === null || !isNaN(value) || t('formValidation.mustBeNumber'),
                                    })}
                                    disabled={loading} isError={!!errors.initialValue}
                                />
                            </FormGroup>
                        )}
                        {isEditMode && (
                            <FormGroup label={t('objectivesForm.currentValueLabel')} htmlFor="currentValue" required={true} error={errors.currentValue?.message}>
                                <Input
                                    type="number" id="currentValue" step="any" placeholder="Ej. 79"
                                    {...register("currentValue", {
                                        valueAsNumber: true,
                                        required: t('formValidation.currentValueRequired'),
                                        min: { value: 0, message: t('formValidation.valuePositive') },
                                        validate: (value) => value === '' || value === null || !isNaN(value) || t('formValidation.mustBeNumber'),
                                    })}
                                    disabled={loading} isError={!!errors.currentValue}
                                />
                            </FormGroup>
                        )}
                        <FormGroup label={t('objectivesForm.targetValueLabel')} htmlFor="targetValue" required={true} error={errors.targetValue?.message}>
                            <Input
                                data-cy="objective-target-value-input" type="number" id="targetValue" step="any" placeholder="Ej. 81"
                                {...register("targetValue", {
                                    valueAsNumber: true,
                                    required: t('formValidation.targetValueRequired'),
                                    min: { value: 0, message: t('formValidation.targetValuePositive') },
                                    validate: (value) => value === '' || value === null || !isNaN(value) || t('formValidation.mustBeValidNonNegativeNumber'),
                                })}
                                disabled={loading} isError={!!errors.targetValue}
                            />
                        </FormGroup>
                        <FormGroup label={t('objectivesForm.unitLabel')} htmlFor="unit" error={errors.unit?.message}>
                            <Input
                                type="text" id="unit" placeholder={t('objectivesForm.unitPlaceholder')}
                                {...register("unit")}
                                disabled={loading} isError={!!errors.unit}
                            />
                        </FormGroup>
                        {(targetValueWatch !== null && targetValueWatch !== '' && !isNaN(parseFloat(targetValueWatch))) && (
                            <FormGroup htmlFor="isLowerBetter">
                                <label className={objetivosStyles.checkboxLabel}>
                                    <input type="checkbox" id="isLowerBetter" {...register("isLowerBetter")} disabled={loading} />
                                    <span>{t('objectivesForm.lowerIsBetter')}</span>
                                </label>
                                {errors.isLowerBetter && (<p className={objetivosStyles.errorText}>{errors.isLowerBetter.message}</p>)}
                            </FormGroup>
                        )}
                    </div>

                    <div className={objetivosStyles.dateFieldsGrid}>
                        <FormGroup label={t('objectivesForm.startDateLabel')} htmlFor="startDate" error={errors.startDate?.message}>
                            <Controller
                                name="startDate"
                                control={control}
                                rules={{ validate: (value) => !value || isValid(value) || t('formValidation.invalidStartDate') }}
                                render={({ field }) => (
                                    <DatePicker
                                        ref={field.ref}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder={t('common.selectDate')}
                                        disabled={loading}
                                        isError={!!errors.startDate}
                                    />
                                )}
                            />
                        </FormGroup>
                        <FormGroup label={t('objectivesForm.endDateLabel')} htmlFor="endDate" required={false} error={errors.endDate?.message}>
                            <Controller
                                name="endDate"
                                control={control}
                                rules={{
                                    // La regla 'required' se ha eliminado.
                                    validate: (value) => {
                                        // Si no hay valor, es válido (opcional).
                                        if (!value) return true;
                                        
                                        // Si hay valor, debe ser una fecha válida.
                                        if (!isValid(value)) return t('formValidation.invalidEndDate');
                                        
                                        // Si hay valor, debe ser posterior a la fecha de inicio.
                                        if (startDateValue && isValid(startDateValue) && value < startDateValue) {
                                            return t('formValidation.endDateAfterStart');
                                        }

                                        // La comprobación de fecha pasada solo se aplica en modo creación si se proporciona una fecha.
                                        if (!isEditMode) {
                                            const today = new Date(); today.setHours(0,0,0,0);
                                            const selectedEndDate = new Date(value); selectedEndDate.setHours(0,0,0,0);
                                            if (selectedEndDate < today) return t('formValidation.endDateNotInPast');
                                        }
                                        return true;
                                    },
                                }}
                                render={({ field }) => (
                                    <DatePicker
                                        ref={field.ref}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder={t('common.selectDate')}
                                        disabled={loading}
                                        isError={!!errors.endDate}
                                        minDate={startDateValue && isValid(startDateValue) ? startDateValue : null}
                                    />
                                )}
                            />
                        </FormGroup>
                    </div>
                    {isEditMode && (
                        <FormGroup label={t('common.status')} htmlFor="status" required={true} error={errors.status?.message}>
                            <Input type="select" id="status" {...register("status", { required: t('formValidation.statusRequired') })} disabled={loading} isError={!!errors.status}>
                                {Object.entries(statusKeyMap).map(([key, value]) => (
                                    <option key={key} value={key}>{t(`status.${value}`)}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    )}
                    <div className={buttonContainerClass.join(' ').trim()}>
                        {(isEditMode || !isFirstObjective) && (
                            <Button type="button" onClick={handleCancelClick} disabled={loading} variant="secondary" >
                                {t('common.cancel')}
                            </Button>
                        )}
                        <Button data-cy="objective-submit-button" type="submit" disabled={loading} variant="primary">
                            {loading ? (isEditMode ? t('common.updating') : t('common.creating')) : finalButtonText}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ObjectiveForm;