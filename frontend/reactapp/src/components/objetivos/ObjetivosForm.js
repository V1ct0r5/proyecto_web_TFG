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
        formState: { errors },
        reset,
        watch,
        control,
        setValue
    } = useForm({
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            category: initialData?.category || '',
            targetValue: initialData?.targetValue !== undefined ? initialData.targetValue : '',
            initialValue: initialData?.initialValue !== undefined ? initialData.initialValue : '',
            currentValue: initialData?.currentValue !== undefined ? initialData.currentValue : '',
            unit: initialData?.unit || '',
            startDate: initialData?.startDate ? parseISO(initialData.startDate) : null,
            endDate: initialData?.endDate ? parseISO(initialData.endDate) : null,
            status: initialData?.status || 'PENDING',
            isLowerBetter: initialData?.isLowerBetter === true,
        }
    });

    const startDateValue = watch("startDate");
    const targetValueWatch = watch("targetValue");

    // Mapeo de valores de backend/formulario a claves de traducción
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
                startDate: initialData.startDate ? parseISO(initialData.startDate) : null,
                endDate: initialData.endDate ? parseISO(initialData.endDate) : null,
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

        // Construye el objeto de datos que coincide con el modelo de Sequelize
        const objectiveData = {
            id: isEditMode ? initialData?.id : undefined,
            name: data.name,
            description: data.description || null,
            category: data.category,
            unit: data.unit || null,
            startDate: data.startDate && isValid(data.startDate) ? format(data.startDate, 'yyyy-MM-dd') : null,
            endDate: data.endDate && isValid(data.endDate) ? format(data.endDate, 'yyyy-MM-dd') : null,
            status: isEditMode ? data.status : "PENDING",
            isLowerBetter: data.isLowerBetter,
            // Los valores numéricos se parsean a Float
            targetValue: (data.targetValue !== '' && data.targetValue !== null && !isNaN(data.targetValue)) ? parseFloat(data.targetValue) : null,
        };

        if (!isEditMode) { // Modo Creación
            objectiveData.initialValue = (data.initialValue !== '' && data.initialValue !== null && !isNaN(data.initialValue)) ? parseFloat(data.initialValue) : null;
            // En creación, currentValue se inicializa igual que initialValue
            objectiveData.currentValue = objectiveData.initialValue;
        } else { // Modo Edición
            objectiveData.currentValue = (data.currentValue !== '' && data.currentValue !== null && !isNaN(data.currentValue)) ? parseFloat(data.currentValue) : null;
             // En edición, el valor inicial no se modifica, por lo que no se envía.
        }

        try {
            await handleFormSubmit(objectiveData);
            if (!isEditMode) {
                reset({
                    name: '', description: '', category: '', targetValue: '',
                    initialValue: '', currentValue: '', unit: '',
                    startDate: null, endDate: null, status: 'PENDING', isLowerBetter: false,
                });
            }
        } catch (err) {
            // El error es manejado por el componente padre
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
                            type="text" id="name" placeholder={t('objectivesForm.namePlaceholder')}
                            {...register("name", {
                                required: t('formValidation.nameRequired'),
                                minLength: { value: 3, message: t('formValidation.nameMinLength', { count: 3 }) },
                            })}
                            disabled={loading} isError={!!errors.name}
                        />
                    </FormGroup>

                    <FormGroup label={t('objectivesForm.descriptionLabel')} htmlFor="description" error={errors.description?.message}>
                        <Input
                            type="textarea" id="description" placeholder={t('objectivesForm.descriptionPlaceholder')}
                            {...register("description")}
                            disabled={loading} isError={!!errors.description}
                        />
                    </FormGroup>

                    <FormGroup label={t('objectivesForm.typeLabel')} htmlFor="category" required={true} error={errors.category?.message}>
                        <Input
                            type="select" id="category"
                            {...register("category", {
                                required: t('formValidation.categoryRequired'),
                                validate: (value) => value !== "" || t('formValidation.categoryRequired'),
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
                                    type="number" id="initialValue" step="any" placeholder="Ej. 78"
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
                                type="number" id="targetValue" step="any" placeholder="Ej. 81"
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
                                name="startDate" control={control}
                                rules={{ validate: (value) => !value || isValid(value) || t('formValidation.invalidStartDate') }}
                                render={({ field }) => (
                                    <DatePicker
                                        {...field} selected={field.value}
                                        onChange={(date) => setValue('startDate', date, { shouldValidate: true, shouldDirty: true })}
                                        placeholder={t('common.selectDate')} disabled={loading} isError={!!errors.startDate}
                                    />
                                )}
                            />
                        </FormGroup>
                        <FormGroup label={t('objectivesForm.endDateLabel')} htmlFor="endDate" required={true} error={errors.endDate?.message}>
                            <Controller
                                name="endDate" control={control}
                                rules={{
                                    required: t('formValidation.endDateRequired'),
                                    validate: (value) => {
                                        if (!value) return t('formValidation.endDateRequired');
                                        if (!isValid(value)) return t('formValidation.invalidEndDate');
                                        if (startDateValue && isValid(startDateValue) && value < startDateValue) {
                                            return t('formValidation.endDateAfterStart');
                                        }
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
                                        {...field} selected={field.value}
                                        onChange={(date) => setValue('endDate', date, { shouldValidate: true, shouldDirty: true })}
                                        placeholder={t('common.selectDate')} disabled={loading} isError={!!errors.endDate}
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
                        <Button type="submit" disabled={loading} variant="primary">
                            {loading ? (isEditMode ? t('common.updating') : t('common.creating')) : finalButtonText}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ObjectiveForm;