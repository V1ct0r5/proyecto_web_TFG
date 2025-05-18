import React, { useState } from "react";
import api from "../../services/apiService";
import { useForm, Controller } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css";

import DatePicker from '../ui/DatePicker/DatePicker';
import { format, isValid } from 'date-fns';

import { toast } from 'react-toastify';


function ObjetivosForm({ onObjectiveCreated }) {
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		control,
	} = useForm();

	const tipoObjetivoOptions = [
		"Salud", "Finanzas", "Desarrollo personal",
		"Relaciones", "Carrera profesional", "Otros",
	];

	const fechaInicioValue = watch("fechaInicio");


	const onSubmit = async (data) => {
		setError("");
		setSuccess("");
		setLoading(true);

		const objectiveData = {
			nombre: data.nombre,
			descripcion: data.descripcion || null,
			tipo_objetivo: data.tipoObjetivo,
			valor_cuantitativo: data.valorCuantitativo === null || isNaN(data.valorCuantitativo) ? null : data.valorCuantitativo,
			unidad_medida: data.unidadMedida || null,
			fecha_inicio: data.fechaInicio && isValid(new Date(data.fechaInicio)) ? format(new Date(data.fechaInicio), 'yyyy-MM-dd') : null,
			fecha_fin: data.fechaFin && isValid(new Date(data.fechaFin)) ? format(new Date(data.fechaFin), 'yyyy-MM-dd') : null,
			estado: data.estado || "Pendiente",
		};

		console.log("Objeto a enviar a la API (objectiveData):", objectiveData);

		try {
			const response = await api.createObjective(objectiveData);

			if (onObjectiveCreated) {
				onObjectiveCreated(response.data);
			}
			setSuccess("Objetivo creado con éxito.");
			setError(null);

			reset();

		} catch (err) {
			console.error(
				"Error al crear el objetivo:",
				err.response ? err.response.data : err.message
			);

			let displayMessage = "Error al crear el objetivo. Por favor, inténtalo de nuevo.";

			if (err.response && err.response.data) {
				if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
					displayMessage = "Errores de validación: " + err.response.data.errors.map((e) => e.msg || e.message || "desconocido").join(", ");

					setError(displayMessage);
					// toast.error(displayMessage);
					setSuccess(null);

					setLoading(false);
					return;

				} else if (err.response.data.message) {
					displayMessage = err.response.data.message;

					setError(displayMessage);
					toast.error(displayMessage);
					setSuccess(null);

				} else if (err.response.data.error) {
					displayMessage = err.response.data.error;

					setError(displayMessage);
					toast.error(displayMessage);
					setSuccess(null);

				} else {
					displayMessage = "Error del servidor: Formato de error desconocido.";

					setError(displayMessage);
					toast.error(displayMessage);
					setSuccess(null);
				}
			} else if (err.message) {
				displayMessage = "Error de conexión: " + err.message;

				setError(displayMessage);
				toast.error(displayMessage);
				setSuccess(null);
			}

			if (onObjectiveCreated) {
				onObjectiveCreated(null, displayMessage);
			}


		} finally {
			setLoading(false);
		}
	};


	return (
		<div>
			{error && <p className="error-message">{error}</p>}
			{success && <p className="success-message">{success}</p>}

			<form onSubmit={handleSubmit(onSubmit)} noValidate>
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
								<option value="">Selecciona un tipo</option>
								{tipoObjetivoOptions.map((option, index) => (
									<option key={index} value={option}>
										{option}
									</option>
								))}
							</Input>
						</FormGroup>
						<div className={objetivosStyles.formGrid}>
						<FormGroup
							label="Valor cuantitativo"
							htmlFor="valorCuantitativo"
							error={errors.valorCuantitativo?.message}
						>
							<Input
								type="number"
								id="valorCuantitativo"
								step="1"
								placeholder="Ej. 5"
								{...register("valorCuantitativo", {
									valueAsNumber: true,
									validate: (value) =>
										!value ||
										(!isNaN(value) && isFinite(value)) ||
										"Debe ser un número válido",
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
										return isValid(new Date(value)) || "Fecha inválida";
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field} // Usamos el spread field
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
							error={errors.fechaFin?.message}
						>
							<Controller
								name="fechaFin"
								control={control}
								rules={{
									validate: (value) => {
										if (!value) return true;
										if (!isValid(new Date(value))) return "Fecha inválida";
										const startDate = watch("fechaInicio");
										if (startDate && isValid(new Date(startDate)) && new Date(value) <= new Date(startDate)) {
											return "La fecha de fin debe ser posterior a la fecha de inicio";
										}
										return true;
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field} // Usamos el spread field
										placeholder="Selecciona una fecha"
										disabled={loading}
										isError={!!errors.fechaFin}
										minDate={fechaInicioValue ? new Date(fechaInicioValue) : null}
									/>
								)}
							/>
						</FormGroup>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? "Creando..." : "Crear objetivo"}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default ObjetivosForm;