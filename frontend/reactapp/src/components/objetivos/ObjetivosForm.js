import React, { useState, useEffect } from "react"; // Importar useEffect si se necesita para algo más que setup
import api from "../../services/apiService";
import { useForm, Controller } from "react-hook-form";
import FormGroup from "../ui/FormGroup";
import Input from "../ui/Input";
import Button from "../ui/Button";
import objetivosStyles from "./ObjetivosForm.module.css"; // Importa los estilos específicos
import DatePicker from '../ui/DatePicker/DatePicker'; // Componente DatePicker
import { format, isValid, parseISO } from 'date-fns'; // Funciones para manejar fechas
import { toast } from 'react-toastify'; // Para notificaciones


// Componente para el formulario de creación/edición de objetivos
function ObjetivosForm({ onObjectiveCreated, initialData }) { // Añadir prop para datos iniciales (edición)
	// Estados locales (considera si son necesarios o si las toasts son suficientes)
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(""); // No usado en el manejo de éxito actual, toast es suficiente
	const [loading, setLoading] = useState(false);

	// Configuración de react-hook-form con datos iniciales si se proporcionan (para edición)
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset, // Función para resetear el formulario
		watch, // Para observar valores de campos (usado para validación de fecha fin)
		control, // Necesario para integrar Controller (DatePicker)
		setValue // Para establecer valores de campos programáticamente (útil con initialData)
	} = useForm({
		// Configura valores por defecto/iniciales. Esto es crucial para el modo edición.
		defaultValues: {
			nombre: initialData?.nombre || '',
			descripcion: initialData?.descripcion || '',
			tipoObjetivo: initialData?.tipo_objetivo || '', // Asegúrate que el nombre del campo coincide con tu formulario
			valorActual: initialData?.valor_actual ?? null, // Usar ?? null para manejar 0 o undefined correctamente
			valorCuantitativo: initialData?.valor_cuantitativo ?? null,
			unidadMedida: initialData?.unidad_medida || '',
			// Convertir las fechas de string (backend) a objetos Date para el DatePicker
			fechaInicio: initialData?.fecha_inicio ? parseISO(initialData.fecha_inicio) : null,
			fechaFin: initialData?.fecha_fin ? parseISO(initialData.fecha_fin) : null,
			estado: initialData?.estado || 'Pendiente', // Asume 'Pendiente' por defecto
		}
	});

	// Observa el valor de fechaInicio para la validación de fechaFin
	const fechaInicioValue = watch("fechaInicio");
	// Observa el valor de tipoObjetivo para condicionales si se necesitan en el futuro
	const tipoObjetivoValue = watch("tipoObjetivo");
	// Observa el valor de valorCuantitativo para mostrar/ocultar campos relacionados (unidad, actual)
	const valorCuantitativoValue = watch("valorCuantitativo");


	const tipoObjetivoOptions = [
		"Salud", "Finanzas", "Desarrollo personal",
		"Relaciones", "Carrera profesional", "Otros",
	];

	// Función que se ejecuta al enviar el formulario
	const onSubmit = async (data) => {
		// Limpia el estado de error local y activa el estado de carga
		setError("");
		setLoading(true);

		// Prepara los datos a enviar al backend.
		// Asegura que los valores numéricos sean realmente null si están vacíos o no son números.
		// Ajusta los nombres de campo para que coincidan con la API del backend.
		const objectiveData = {
			nombre: data.nombre,
			descripcion: data.descripcion || null, // Envía null si la descripción está vacía
			tipo_objetivo: data.tipoObjetivo,
			valor_cuantitativo: (data.valorCuantitativo !== null && !isNaN(data.valorCuantitativo)) ? parseFloat(data.valorCuantitativo) : null,
			unidad_medida: data.unidadMedida || null,
			fecha_inicio: data.fechaInicio && isValid(data.fechaInicio) ? format(data.fechaInicio, 'yyyy-MM-dd') : null,
			fecha_fin: data.fechaFin && isValid(data.fechaFin) ? format(data.fechaFin, 'yyyy-MM-dd') : null,
			estado: initialData?.estado || data.estado || "Pendiente",
			valor_actual: (data.valorActual !== null && !isNaN(data.valorActual)) ? parseFloat(data.valorActual) : null,
		};

		console.log("Objeto a enviar a la API (objectiveData):", objectiveData); // Log para depuración

		try {
			let response;
			// Lógica para determinar si es creación o edición
			if (initialData?.id_objetivo) { // Si hay initialData con ID, es edición
				response = await api.updateObjective(initialData.id_objetivo, objectiveData);
				toast.success("Objetivo actualizado con éxito.");
			} else { // Si no hay initialData o ID, es creación
				response = await api.createObjective(objectiveData);
				toast.success("Objetivo creado con éxito.");
			}


			// Si la operación fue exitosa, llama al callback y resetea el formulario (solo en creación o si se decide resetear en edición)
			if (onObjectiveCreated) {
				onObjectiveCreated(response.data); // Pasa el objetivo creado/actualizado al padre
			}
			// setSuccess("Objetivo creado con éxito."); // Redundante con toast
			setError(null); // Asegura que el error local esté limpio

			// Resetear el formulario solo después de la creación exitosa
			if (!initialData?.id_objetivo) {
				reset(); // Limpia los campos del formulario solo en creación
			}


		} catch (err) {
			// Manejo de errores
			console.error(
				"Error al procesar el objetivo:", // Mensaje de log más general para creación/edición
				err.response ? err.response.data : err.message
			);

			let displayMessage = "Error al procesar el objetivo. Por favor, inténtalo de nuevo."; // Mensaje de error genérico

			if (err.response) {
				// Errores de validación (express-validator)
				if (err.response.status === 400 && err.response.data?.errors && Array.isArray(err.response.data.errors)) {
					// Concatena todos los mensajes de error de validación
					displayMessage = "Errores de validación: " + err.response.data.errors.map((e) => e.msg || "Error desconocido").join(", ");
				}
				// Otros errores del servidor con mensaje
				else if (err.response.data?.message) {
					displayMessage = err.response.data.message; // Usa el mensaje del backend
				}
				// Otros errores del servidor con campo 'error'
				else if (err.response.data?.error) {
					displayMessage = err.response.data.error; // Usa el campo 'error' del backend
				}
				// Formato de error desconocido del servidor
				else {
					displayMessage = "Error del servidor: Formato de error desconocido.";
				}
			} else if (err.message) {
				// Errores de conexión o de red
				displayMessage = "Error de conexión: " + err.message;
			}
			setError(displayMessage);
			toast.error(displayMessage);
			if (onObjectiveCreated) {
				onObjectiveCreated(null, displayMessage);
			}
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className={objetivosStyles.formContainer}>
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
								step="1"
								placeholder="Ej. 2.5"
								{...register("valorActual", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: "El valor debe ser positivo o cero."
									},
									validate: (value) =>
										!value ||
										(!isNaN(value) && isFinite(value)) ||
										"Debe ser un número válido",
								})}
								disabled={loading}
								isError={!!errors.valorActual}
							/>
						</FormGroup>
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
								min="0"
								{...register("valorCuantitativo", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: "El valor debe ser positivo o cero."
									},
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
								min="0"
								disabled={loading}
								isError={!!errors.unidadMedida}
							/>
						</FormGroup>
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
										return isValid(value) || "Fecha inválida";
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field}
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
										if (!isValid(value)) return "Fecha inválida";
										const endDate = value;
										const startDate = watch("fechaInicio");
										if (startDate && isValid(startDate) && endDate <= startDate) {
											return "La fecha de fin debe ser posterior a la fecha de inicio";
										}
										return true;
									},
								}}
								render={({ field }) => (
									<DatePicker
										{...field}
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
								{['Pendiente', 'En progreso', 'Completado'].map((option) => (
									<option key={option} value={option}>{option}</option>
								))}
							</Input>
						</FormGroup>
					)}
					<Button type="submit" disabled={loading}>
						{loading ? "Creando..." : initialData?.id_objetivo ? "Actualizar objetivo" : "Crear objetivo"}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default ObjetivosForm;