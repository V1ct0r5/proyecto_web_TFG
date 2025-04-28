import React from "react";
import api from "../../services/apiService";

function ObjetivosForm({ onObjectiveCreated  }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipoObjetivo, setTipoObjetivo] = useState('');
    const [valorCuantitativo, setValorCuantitativo] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estado, setEstado] = useState('Pendiente'); // Estado inicial del objetivo
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false); // Estado de carga

    const tipoObjetivoOptions = [
        'Salud',
        'Finanzas',
        'Desarrollo personal',
        'Relaciones',
        'Carrera profesional',
        'Otros'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true); // Iniciar el estado de carga

        // Preparar los datos del objetivo
        const objectiveData = {
            nombre,
            descripcion: descripcion || null,
            tipoObjetivo: tipoObjetivo,
            valorCuantitativo: valorCuantitativo ? parseFloat(valorCuantitativo) : null,
            unidadMedida: unidadMedida || null,
            fechaInicio: fechaInicio || null,
            fechaFin: fechaFin || null,
            estado: estado,
        };

        try {
            const response = await api.createObjective(objectiveData);

            setSuccess('Objetivo creado con éxito.');
            // Limpiar los campos del formulario
            setNombre('');
            setDescripcion('');
            setTipoObjetivo('');
            setValorCuantitativo('');
            setUnidadMedida('');
            setFechaInicio('');
            setFechaFin('');
            setEstado('Pendiente');

            // Llama a la función pasada por props para notificar que se ha creado un objetivo
            if (onObjectiveCreated) {
                onObjectiveCreated(response.data); // Pasa el nuevo objetivo creado
            }

        } catch (error) {
            console.error('Error al crear el objetivo:', error);
            // Mostrar mensaje(s) de error del backend si está(n) disponible(s)
            if ( error.response && error.response.data && error.response.data.errors) {
                setError(error.response.data.errors.map(e => e.msg).join(', '));
            } else if(error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message); // Errores generales
            } else {
                setError('Error al crear el objetivo. Por favor, inténtalo de nuevo.');
            }
        } finally {
            setLoading(false); // Finalizar el estado de carga
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="nombre">Nombre del objetivo:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={loading} // Deshabilitar el campo si está cargando
                />
            </div>

            <div>
                <label htmlFor="descripcion">Descripción:</label>
                <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={loading} 
                />
            </div>

            <div>
                <label htmlFor="tipoObjetivo">Tipo de objetivo:</label>
                <select
                    id="tipoObjetivo"
                    value={tipoObjetivo}
                    onChange={(e) => setTipoObjetivo(e.target.value)}
                    required
                    disabled={loading} 
                >
                    <option value="">Selecciona un tipo</option>
                    {tipoObjetivoOptions.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                    ))}
                </select>
            </div>
            
            <div>
                <label htmlFor="valorCuantitativo">Valor cuantitativo (Opcional):</label>
                <input
                    type="number"
                    id="valorCuantitativo"
                    step="0.01" // Permitir decimales
                    value={valorCuantitativo}
                    onChange={(e) => setValorCuantitativo(e.target.value)}
                    disabled={loading} 
                />
            </div>

            <div>
                <label htmlFor="unidadMedida">Unidad de medida (Opcional):</label>
                <input
                    type="text"
                    id="unidadMedida"
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value)}
                    disabled={loading} 
                />
            </div>

            <div>
                <label htmlFor="fechaInicio">Fecha de inicio (Opcional):</label>
                <input
                    type="date"
                    id="fechaInicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    disabled={loading} 
                />
            </div>

            <div>
                <label htmlFor="fechaFin">Fecha de fin (Opcional):</label>
                <input
                    type="date"
                    id="fechaFin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    disabled={loading} 
                />
            </div>
            
            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            <button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Objetivo'}
            </button>
        </form>
    );
}

export default ObjetivosForm;

