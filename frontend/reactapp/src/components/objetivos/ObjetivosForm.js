import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css";
import DatePicker from '../ui/DatePicker/DatePicker';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'react-toastify';

function ObjetivosForm({ 
    initialData = null, 
    onSubmit: handleFormSubmit, 
    buttonText = "Crear Objetivo", 
    isFirstObjective = false, 
    isEditMode = false, 
    onCancel 
}) {
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
            nombre: initialData?.nombre || '',
            descripcion: initialData?.descripcion || '',
            tipoObjetivo: initialData?.tipo_objetivo || '',
            valorMeta: initialData?.valor_cuantitativo !== undefined ? initialData.valor_cuantitativo : '',
            valorInicial: initialData?.valor_inicial_numerico !== undefined ? initialData.valor_inicial_numerico : '',
            valorActual: initialData?.valor_actual !== undefined ? initialData.valor_actual : '',
            unidadMedida: initialData?.unidad_medida || '',
            fechaInicio: initialData?.fecha_inicio ? parseISO(initialData.fecha_inicio) : null,
            fechaFin: initialData?.fecha_fin ? parseISO(initialData.fecha_fin) : null,
            estado: initialData?.estado || 'Pendiente',
            es_menor_mejor: initialData?.es_menor_mejor === true,
        }
    });

    const fechaInicioValue = watch("fechaInicio");
    const valorMetaValue = watch("valorMeta"); // Usado para mostrar condicionalmente el checkbox 'es_menor_mejor'

    const tipoObjetivoOptions = [
        "Salud", "Finanzas", "Desarrollo personal",
        "Relaciones", "Carrera profesional", "Otros",
    ];

    useEffect(() => {
        const defaultFormValues = {
            nombre: '',
            descripcion: '',
            tipoObjetivo: '',
            valorMeta: '',
            valorInicial: '',
            valorActual: '', // Se maneja en onSubmitInternal para creación
            unidadMedida: '',
            fechaInicio: null,
            fechaFin: null,
            estado: 'Pendiente',
            es_menor_mejor: false,
        };

        if (initialData) {
            reset({
                nombre: initialData.nombre || '',
                descripcion: initialData.descripcion || '',
                tipoObjetivo: initialData.tipo_objetivo || '',
                valorMeta: initialData.valor_cuantitativo !== undefined ? initialData.valor_cuantitativo : '',
                valorInicial: initialData.valor_inicial_numerico !== undefined ? initialData.valor_inicial_numerico : '',
                valorActual: initialData.valor_actual !== undefined ? initialData.valor_actual : '',
                unidadMedida: initialData.unidad_medida || '',
                fechaInicio: initialData.fecha_inicio ? parseISO(initialData.fecha_inicio) : null,
                fechaFin: initialData.fecha_fin ? parseISO(initialData.fecha_fin) : null,
                estado: initialData.estado || 'Pendiente',
                es_menor_mejor: initialData.es_menor_mejor === true,
            });
        } else {
            reset(defaultFormValues);
        }
    }, [initialData, reset]);

    const onSubmitInternal = async (data) => {
        setLoading(true);

        const objectiveData = {
            id_objetivo: isEditMode ? initialData?.id_objetivo : undefined,
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            tipo_objetivo: data.tipoObjetivo,
            unidad_medida: data.unidadMedida || null,
            fecha_inicio: data.fechaInicio && isValid(data.fechaInicio) ? format(data.fechaInicio, 'yyyy-MM-dd') : null,
            fecha_fin: data.fechaFin && isValid(data.fechaFin) ? format(data.fechaFin, 'yyyy-MM-dd') : null,
            estado: isEditMode ? data.estado : "Pendiente", // Estado solo se envía/modifica en edición desde el form
            es_menor_mejor: data.es_menor_mejor,
        };

        if (!isEditMode) { // Modo Creación
            objectiveData.valor_inicial_numerico = (data.valorInicial !== '' && data.valorInicial !== null && !isNaN(data.valorInicial)) ? parseFloat(data.valorInicial) : null;
            objectiveData.valor_cuantitativo = (data.valorMeta !== '' && data.valorMeta !== null && !isNaN(data.valorMeta)) ? parseFloat(data.valorMeta) : null;
            // En creación, valor_actual se inicializa igual al valor_inicial_numerico
            objectiveData.valor_actual = objectiveData.valor_inicial_numerico; 
        } else { // Modo Edición
            objectiveData.valor_actual = (data.valorActual !== '' && data.valorActual !== null && !isNaN(data.valorActual)) ? parseFloat(data.valorActual) : null;
            // Mantener valor_inicial y valor_meta de initialData, no se modifican desde el form en edición
            objectiveData.valor_inicial_numerico = (initialData.valor_inicial_numerico !== undefined && initialData.valor_inicial_numerico !== null && !isNaN(initialData.valor_inicial_numerico)) ? parseFloat(initialData.valor_inicial_numerico) : null;
            objectiveData.valor_cuantitativo = (initialData.valor_cuantitativo !== undefined && initialData.valor_cuantitativo !== null && !isNaN(initialData.valor_cuantitativo)) ? parseFloat(initialData.valor_cuantitativo) : null;
        }

        try {
            await handleFormSubmit(objectiveData); // La función handleFormSubmit viene del componente padre
            if (!isEditMode) { // Solo resetea si es creación y fue exitoso
                reset({ // Resetea a valores vacíos explícitos
                    nombre: '', descripcion: '', tipoObjetivo: '', valorMeta: '',
                    valorInicial: '', valorActual: '', unidadMedida: '',
                    fechaInicio: null, fechaFin: null, estado: 'Pendiente', es_menor_mejor: false,
                });
            }
        } catch (err) {
            // El error es (o debería ser) manejado por el componente padre que pasa handleFormSubmit
            // o por el interceptor de errores de apiService.
            // No se muestra toast aquí para evitar duplicados si el padre ya lo hace.
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel(); // Ejecuta la función onCancel provista por el padre
        } else {
            // Comportamiento por defecto si no hay onCancel: resetear y notificar
            reset(); // Resetea a los defaultValues que consideran initialData o vacío
            toast.info("Formulario limpiado.");
        }
    };

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
                    <FormGroup label="Nombre del objetivo" htmlFor="nombre" required={true} error={errors.nombre?.message}>
                        <Input
                            type="text" id="nombre" placeholder="Ej. Correr 5km diarios"
                            {...register("nombre", {
                                required: "El nombre es obligatorio",
                                minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" },
                            })}
                            disabled={loading} isError={!!errors.nombre}
                        />
                    </FormGroup>
                    <FormGroup label="Descripción" htmlFor="descripcion" error={errors.descripcion?.message}>
                        <Input
                            type="textarea" id="descripcion" placeholder="Describe los detalles de tu objetivo"
                            {...register("descripcion")}
                            disabled={loading} isError={!!errors.descripcion}
                        />
                    </FormGroup>
                    <FormGroup label="Tipo de objetivo" htmlFor="tipoObjetivo" required={true} error={errors.tipoObjetivo?.message}>
                        <Input
                            type="select" id="tipoObjetivo"
                            {...register("tipoObjetivo", {
                                required: "El tipo de objetivo es obligatorio",
                                validate: (value) => value !== "" || "El tipo de objetivo es obligatorio",
                            })}
                            disabled={loading} isError={!!errors.tipoObjetivo}
                        >
                            <option value="" disabled>Selecciona un tipo</option>
                            {tipoObjetivoOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </Input>
                    </FormGroup>

                    <div className={objetivosStyles.formGrid}>
                        {!isEditMode && (
                            <FormGroup label="Valor inicial" htmlFor="valorInicial" required={true} error={errors.valorInicial?.message}>
                                <Input
                                    type="number" id="valorInicial" step="any" placeholder="Ej. 78"
                                    {...register("valorInicial", {
                                        valueAsNumber: true,
                                        required: "El valor inicial es obligatorio.",
                                        min: { value: 0, message: "El valor inicial debe ser positivo o cero." },
                                        validate: (value) => value === '' || value === null || (!isNaN(value) && isFinite(value)) || "Debe ser un número válido",
                                    })}
                                    disabled={loading} isError={!!errors.valorInicial}
                                />
                            </FormGroup>
                        )}
                        {isEditMode && (
                            <FormGroup label="Valor actual" htmlFor="valorActual" required={true} error={errors.valorActual?.message}>
                                <Input
                                    type="number" id="valorActual" step="any" placeholder="Ej. 79"
                                    {...register("valorActual", {
                                        valueAsNumber: true,
                                        required: "El valor actual es obligatorio.",
                                        min: { value: 0, message: "El valor debe ser positivo o cero." },
                                        validate: (value) => value === '' || value === null || (!isNaN(value) && isFinite(value)) || "Debe ser un número válido",
                                    })}
                                    disabled={loading} isError={!!errors.valorActual}
                                />
                            </FormGroup>
                        )}
                        <FormGroup label="Valor meta" htmlFor="valorMeta" required={true} error={errors.valorMeta?.message}>
                            <Input
                                type="number" id="valorMeta" step="any" placeholder="Ej. 81"
                                {...register("valorMeta", {
                                    valueAsNumber: true,
                                    min: { value: 0, message: "El valor meta debe ser positivo o cero." },
                                    required: "El valor meta es obligatorio.",
                                    validate: (value) => value === '' || value === null || (!isNaN(value) && isFinite(value)) || "Debe ser un número válido y no negativo",
                                })}
                                disabled={loading} isError={!!errors.valorMeta}
                            />
                        </FormGroup>
                        <FormGroup label="Unidad de medida" htmlFor="unidadMedida" error={errors.unidadMedida?.message}>
                            <Input
                                type="text" id="unidadMedida" placeholder="Ej. kilómetros"
                                {...register("unidadMedida")}
                                disabled={loading} isError={!!errors.unidadMedida}
                            />
                        </FormGroup>
                        {(valorMetaValue !== null && valorMetaValue !== '' && !isNaN(parseFloat(valorMetaValue))) && ( // Asegurar que valorMetaValue es parseable a número
                            <FormGroup htmlFor="es_menor_mejor">
                                <label className={objetivosStyles.checkboxLabel}>
                                    <input type="checkbox" id="es_menor_mejor" {...register("es_menor_mejor")} disabled={loading} />
                                    <span>Un valor más bajo es mejor (ej. tiempo, coste)</span>
                                </label>
                                {errors.es_menor_mejor && (<p className={objetivosStyles.errorText}>{errors.es_menor_mejor.message}</p>)}
                            </FormGroup>
                        )}
                    </div>

                    <div className={objetivosStyles.dateFieldsGrid}>
                        <FormGroup label="Fecha de inicio" htmlFor="fechaInicio" error={errors.fechaInicio?.message}>
                            <Controller
                                name="fechaInicio" control={control}
                                rules={{ validate: (value) => !value || isValid(value) || "Fecha de inicio inválida" }}
                                render={({ field }) => (
                                    <DatePicker
                                        {...field} selected={field.value}
                                        onChange={(date) => setValue('fechaInicio', date, { shouldValidate: true, shouldDirty: true })}
                                        placeholder="Selecciona una fecha" disabled={loading} isError={!!errors.fechaInicio}
                                    />
                                )}
                            />
                        </FormGroup>
                        <FormGroup label="Fecha de finalización" htmlFor="fechaFin" required={true} error={errors.fechaFin?.message}>
                            <Controller
                                name="fechaFin" control={control}
                                rules={{
                                    required: "La fecha de fin es obligatoria",
                                    validate: (value) => {
                                        if (!value) return "La fecha de fin es obligatoria";
                                        if (!isValid(value)) return "Fecha de fin inválida";
                                        const endDate = value;
                                        const startDate = watch("fechaInicio");
                                        if (startDate && isValid(startDate) && endDate < startDate) {
                                            return "La fecha de fin debe ser posterior a la fecha de inicio";
                                        }
                                        if (!isEditMode) {
                                            const today = new Date(); today.setHours(0,0,0,0);
                                            const selectedEndDate = new Date(endDate); selectedEndDate.setHours(0,0,0,0);
                                            if (selectedEndDate < today) return "La fecha de fin no puede ser en el pasado.";
                                        }
                                        return true;
                                    },
                                }}
                                render={({ field }) => (
                                    <DatePicker
                                        {...field} selected={field.value}
                                        onChange={(date) => setValue('fechaFin', date, { shouldValidate: true, shouldDirty: true })}
                                        placeholder="Selecciona una fecha" disabled={loading} isError={!!errors.fechaFin}
                                        minDate={fechaInicioValue && isValid(fechaInicioValue) ? fechaInicioValue : null}
                                    />
                                )}
                            />
                        </FormGroup>
                    </div>
                    {isEditMode && (
                        <FormGroup label="Estado" htmlFor="estado" required={true} error={errors.estado?.message}>
                            <Input type="select" id="estado" {...register("estado", { required: "El estado es obligatorio" })} disabled={loading} isError={!!errors.estado}>
                                {['Pendiente', 'En progreso', 'Completado', 'Archivado', 'Fallido'].map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    )}
                    <div className={buttonContainerClass.join(' ').trim()}>
                        {(isEditMode || !isFirstObjective) && (
                            <Button type="button" onClick={handleCancelClick} disabled={loading} variant="secondary" >
                                Cancelar
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} variant="primary">
                            {loading ? (isEditMode ? "Actualizando..." : "Creando...") : buttonText}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ObjetivosForm;