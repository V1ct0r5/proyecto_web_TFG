import React, { useState } from "react";
import api from "../../services/apiService";
import { useForm } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css";

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
	} = useForm();

	const tipoObjetivoOptions = [
		"Salud",
		"Finanzas",
		"Desarrollo personal",
		"Relaciones",
		"Carrera profesional",
		"Otros",
	];

	const fechaInicio = watch("fechaInicio", "");

	const onSubmit = async (data) => {
		setError("");
		setSuccess("");
		setLoading(true);

		const objectiveData = {
			nombre: data.nombre,
			descripcion: data.descripcion || null,
			tipo_objetivo: data.tipoObjetivo,
			valor_cuantitativo:
				data.valorCuantitativo !== "" &&
					data.valorCuantitativo !== null &&
					!isNaN(data.valorCuantitativo)
					? parseFloat(data.valorCuantitativo)
					: null,
			unidad_medida: data.unidadMedida || null,
			fecha_inicio: data.fechaInicio || null,
			fecha_fin: data.fechaFin || null,
			estado: data.estado || "Pendiente",
		};

		try {
			const response = await api.createObjective(objectiveData);
			if (onObjectiveCreated) {
				onObjectiveCreated(response.data);
			}
			setSuccess("Objetivo creado con éxito.");
			reset();
			setError(null);
		} catch (err) {
			console.error(
				"Error al crear el objetivo:",
				err.response ? err.response.data : err.message
			);
			let errorMessage =
				"Error al crear el objetivo. Por favor, inténtalo de nuevo.";
			if (err.response && err.response.data) {
				if (
					err.response.data.errors &&
					Array.isArray(err.response.data.errors)
				) {
					errorMessage =
						"Errores de validación: " +
						err.response.data.errors
							.map((e) => e.msg || e.message || "desconocido")
							.join(", ");
				} else if (err.response.data.message) {
					errorMessage = err.response.data.message;
				} else if (err.response.data.error) {
					errorMessage = err.response.data.error;
				}
			} else {
				errorMessage = "Error de red o del servidor.";
			}
			setError(errorMessage);
			setSuccess(null);

			if (onObjectiveCreated) {
				onObjectiveCreated(null, errorMessage);
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
					<div className={objetivosStyles.formGrid}>
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

						<FormGroup
							label="Estado"
							htmlFor="estado"
							error={errors.estado?.message}
						>
							<Input
								type="select"
								id="estado"
								{...register("estado")}
								disabled={loading}
								isError={!!errors.estado}
							>
								<option value="Pendiente">Pendiente</option>
							</Input>
						</FormGroup>

						<FormGroup
							label="Valor cuantitativo"
							htmlFor="valorCuantitativo"
							error={errors.valorCuantitativo?.message}
						>
							<Input
								type="number"
								id="valorCuantitativo"
								step="0.01"
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
							<Input
								type="date"
								id="fechaInicio"
								placeholder="dd/mm/aaaa"
								{...register("fechaInicio", {
									validate: (value) =>
										!value || !isNaN(new Date(value)) || "Fecha inválida",
								})}
								disabled={loading}
								isError={!!errors.fechaInicio}
							/>
						</FormGroup>
						<FormGroup
							label="Fecha de finalización"
							htmlFor="fechaFin"
							error={errors.fechaFin?.message}
						>
							<Input
								type="date"
								id="fechaFin"
								placeholder="dd/mm/aaaa"
								{...register("fechaFin", {
									validate: (value) => {
										if (!value) return true;
										const startDate = watch("fechaInicio");
										if (isNaN(new Date(value))) return "Fecha inválida";
										if (
											startDate &&
											new Date(value) &&
											new Date(startDate) &&
											new Date(value) <= new Date(startDate)
										) {
											return "La fecha de fin debe ser posterior a la fecha de inicio";
										}
										return true;
									},
								})}
								disabled={loading}
								isError={!!errors.fechaFin}
							/>
						</FormGroup>
					</div>{" "}
				</div>{" "}
				<Button type="submit" disabled={loading}>
					{loading ? "Creando..." : "Crear objetivo"}
				</Button>
			</form>
		</div>
	);
}

export default ObjetivosForm;
