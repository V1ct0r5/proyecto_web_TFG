import React, { useState, useEffect } from "react";
import apiService from "../../services/apiService";
import { useForm, Controller } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css";
import DatePicker from '../ui/DatePicker/DatePicker';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from 'react-toastify';

// AÑADE 'onCancel' a las props del componente
function ObjetivosForm({ initialData = null, onSubmit: handleFormSubmit, buttonText = "Crear Objetivo", isFirstObjective = false, isEditMode = false, onCancel }) {
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
			valorActual: initialData?.valor_actual !== undefined ? initialData.valor_actual : '',
			valorCuantitativo: initialData?.valor_cuantitativo !== undefined ? initialData.valor_cuantitativo : '',
			unidadMedida: initialData?.unidad_medida || '',
			fechaInicio: initialData?.fecha_inicio ? parseISO(initialData.fecha_inicio) : null,
			fechaFin: initialData?.fecha_fin ? parseISO(initialData.fecha_fin) : null,
			estado: initialData?.estado || 'Pendiente',
			es_menor_mejor: initialData?.es_menor_mejor === true,
		}
	});

	const fechaInicioValue = watch("fechaInicio");
	const valorCuantitativoValue = watch("valorCuantitativo");

	const tipoObjetivoOptions = [
		"Salud", "Finanzas", "Desarrollo personal",
		"Relaciones", "Carrera profesional", "Otros",
	];

	useEffect(() => {
		if (initialData) {
			reset({
				nombre: initialData.nombre || '',
				descripcion: initialData.descripcion || '',
				tipoObjetivo: initialData.tipo_objetivo || '',
				valorActual: initialData.valor_actual !== undefined ? initialData.valor_actual : '',
				valorCuantitativo: initialData.valor_cuantitativo !== undefined ? initialData.valor_cuantitativo : '',
				unidadMedida: initialData.unidad_medida || '',
				fechaInicio: initialData.fecha_inicio ? parseISO(initialData.fecha_inicio) : null,
				fechaFin: initialData.fecha_fin ? parseISO(initialData.fecha_fin) : null,
				estado: initialData.estado || 'Pendiente',
				es_menor_mejor: initialData.es_menor_mejor === true,
			});
		} else {
			reset();
		}
	}, [initialData, reset]);

	const onSubmitInternal = async (data) => {
		setLoading(true);

		const objectiveData = {
			nombre: data.nombre,
			descripcion: data.descripcion || null,
			tipo_objetivo: data.tipoObjetivo,
			valor_actual: (data.valorActual !== '' && data.valorActual !== null && !isNaN(data.valorActual)) ? parseFloat(data.valorActual) : null,
			valor_cuantitativo: (data.valorCuantitativo !== '' && data.valorCuantitativo !== null && !isNaN(data.valorCuantitativo)) ? parseFloat(data.valorCuantitativo) : null,
			unidad_medida: data.unidadMedida || null,
			fecha_inicio: data.fechaInicio && isValid(data.fechaInicio) ? format(data.fechaInicio, 'yyyy-MM-dd') : null,
			fecha_fin: data.fechaFin && isValid(data.fechaFin) ? format(data.fechaFin, 'yyyy-MM-dd') : null,
			estado: initialData?.id_objetivo ? data.estado : "Pendiente",
			es_menor_mejor: data.es_menor_mejor,
		};

		console.log("Objeto a enviar a la API (objectiveData):", objectiveData);

		try {
			await handleFormSubmit(objectiveData);
			// Solo resetea el formulario si NO es un objetivo existente (es decir, es una creación)
			if (!initialData?.id_objetivo) {
				reset();
			}
		} catch (err) {
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const handleCancelClick = () => {
		// Invoca la función onCancel pasada desde la página padre
		if (onCancel) {
			onCancel();
		} else {
			// Si no se pasa onCancel (ej. en modo edición, donde el botón de cancelar está fuera),
			// simplemente resetea el formulario como un fallback, aunque idealmente esto no debería ocurrir.
			reset();
			toast.info("Formulario limpiado.");
		}
	};

	const buttonContainerClass = [objetivosStyles.buttonContainer];

	// Si está en modo edición O no es el primer objetivo (lo que implica que "Cancelar" estará presente)
	if (isEditMode || !isFirstObjective) {
		buttonContainerClass.push(objetivosStyles.buttonsWithCancel); // Usaremos una nueva clase para space-between
	} else {
		// Para el primer objetivo en modo creación, solo botón de submit
		buttonContainerClass.push(objetivosStyles.firstObjectiveButtons); // Mantendrá flex-end
	}


	return (
		<div className={objetivosStyles.formContainer}>
			<form onSubmit={handleSubmit(onSubmitInternal)} noValidate>
				<div className={objetivosStyles.formGroupContainer}>
					<FormGroup
						label="Nombre del objetivo"
						htmlFor="nombre"
						required={true}
						error={errors.nombre?.message}
					>
						<Input
							type="text"
							id="nombre"
							placeholder="Ej. Correr 5km diarios"
							{...register("nombre", {
								required: "El nombre es obligatorio",
								minLength: {
									value: 3,
									message: "El nombre debe tener al menos 3 caracteres",
								},
							})}
							disabled={loading}
							isError={!!errors.nombre}
						/>
					</FormGroup>
					<FormGroup
						label="Descripción"
						htmlFor="descripcion"
						error={errors.descripcion?.message}
					>
						<Input
							type="textarea"
							id="descripcion"
							placeholder="Describe los detalles de tu objetivo"
							{...register("descripcion")}
							disabled={loading}
							isError={!!errors.descripcion}
						/>
					</FormGroup>
					<FormGroup
						label="Tipo de objetivo"
						htmlFor="tipoObjetivo"
						required={true}
						error={errors.tipoObjetivo?.message}
					>
						<Input
							type="select"
							id="tipoObjetivo"
							{...register("tipoObjetivo", {
								required: "El tipo de objetivo es obligatorio",
								validate: (value) =>
									value !== "" || "El tipo de objetivo es obligatorio",
							})}
							disabled={loading}
							isError={!!errors.tipoObjetivo}
						>
							<option value="" disabled>Selecciona un tipo</option>
							{tipoObjetivoOptions.map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
						</Input>
					</FormGroup>
					<div className={objetivosStyles.formGrid}>
						<FormGroup
							label="Valor actual"
							htmlFor="valorActual"
							error={errors.valorActual?.message}
						>
							<Input
								type="number"
								id="valorActual"
								step="any"
								placeholder="Ej. 2.5"
								{...register("valorActual", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: "El valor debe ser positivo o cero."
									},
									validate: (value) =>
										value === '' || value === null || (!isNaN(value) && isFinite(value)) || "Debe ser un número válido",
								})}
								disabled={loading}
								isError={!!errors.valorActual}
							/>
						</FormGroup>
						<FormGroup
							label="Valor meta"
							htmlFor="valorCuantitativo"
							error={errors.valorCuantitativo?.message}
						>
							<Input
								type="number"
								id="valorCuantitativo"
								step="any"
								placeholder="Ej. 5"
								{...register("valorCuantitativo", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: "El valor meta debe ser positivo o cero."
									},
									required: {
										value: true,
										message: "El valor meta es obligatorio."
									},
									validate: (value) =>
										value === '' || value === null || (!isNaN(value) && isFinite(value)) || "Debe ser un número válido y no negativo",
								})}
								disabled={loading}
								isError={!!errors.valorCuantitativo}
							/>
						</FormGroup>
						<FormGroup
							label="Unidad de medida"
							htmlFor="unidadMedida"
							error={errors.unidadMedida?.message}
						>
							<Input
								type="text"
								id="unidadMedida"
								placeholder="Ej. kilómetros"
								{...register("unidadMedida")}
								disabled={loading}
								isError={!!errors.unidadMedida}
							/>
						</FormGroup>
						{(valorCuantitativoValue !== null && valorCuantitativoValue !== '' && !isNaN(valorCuantitativoValue)) && (
							<FormGroup htmlFor="es_menor_mejor">
								<label className={objetivosStyles.checkboxLabel}>
									<input
										type="checkbox"
										id="es_menor_mejor"
										{...register("es_menor_mejor")}
										disabled={loading}
									/>
									<span>Un valor más bajo es mejor (ej. tiempo, coste)</span>
								</label>
								{errors.es_menor_mejor && (
									<p className={objetivosStyles.errorText}>{errors.es_menor_mejor.message}</p>
								)}
							</FormGroup>
						)}
					</div>
					<div className={objetivosStyles.dateFieldsGrid}>
						<FormGroup
							label="Fecha de inicio"
							htmlFor="fechaInicio"
							error={errors.fechaInicio?.message}
						>
							<Controller
								name="fechaInicio"
								control={control}
								rules={{
									validate: (value) => {
										if (!value) return true;
										return isValid(value) || "Fecha de inicio inválida";
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field}
										selected={field.value}
										onChange={(date) => field.onChange(date)}
										placeholder="Selecciona una fecha"
										disabled={loading}
										isError={!!errors.fechaInicio}
									/>
								)}
							/>
						</FormGroup>
						<FormGroup
							label="Fecha de finalización"
							htmlFor="fechaFin"
							required={true}
							error={errors.fechaFin?.message}
						>
							<Controller
								name="fechaFin"
								control={control}
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

										if (!initialData?.id_objetivo) {
											const today = new Date();
											today.setHours(0, 0, 0, 0);
											const selectedEndDate = new Date(endDate);
											selectedEndDate.setHours(0, 0, 0, 0);

											if (selectedEndDate < today) {
												return "La fecha de fin no puede ser en el pasado.";
											}
										}
										return true;
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field}
										selected={field.value}
										onChange={(date) => field.onChange(date)}
										placeholder="Selecciona una fecha"
										disabled={loading}
										isError={!!errors.fechaFin}
										minDate={fechaInicioValue && isValid(fechaInicioValue) ? fechaInicioValue : null}
									/>
								)}
							/>
						</FormGroup>
					</div>
					{initialData?.id_objetivo && (
						<FormGroup
							label="Estado"
							htmlFor="estado"
							required={true}
							error={errors.estado?.message}
						>
							<Input
								type="select"
								id="estado"
								{...register("estado", {
									required: "El estado es obligatorio",
								})}
								disabled={loading}
								isError={!!errors.estado}
							>
								{['Pendiente', 'En progreso', 'Completado', 'Archivado', 'Fallido'].map((option) => (
									<option key={option} value={option}>{option}</option>
								))}
							</Input>
						</FormGroup>
					)}
					<div className={buttonContainerClass.join(' ').trim()}>
						{(isEditMode || !isFirstObjective) && (
							<Button type="button" onClick={handleCancelClick} disabled={loading} className={objetivosStyles.cancelButton}>
								Cancelar
							</Button>
						)}
						<Button type="submit" disabled={loading}>
							{loading ? (initialData?.id_objetivo ? "Actualizando..." : "Creando...") : buttonText}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}

export default ObjetivosForm;