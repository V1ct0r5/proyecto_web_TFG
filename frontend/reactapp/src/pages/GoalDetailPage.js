// frontend/src/pages/GoalDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './GoalDetailPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GoalProgressChart from '../components/charts/GoalProgressChart';
import Button from '../components/ui/Button';

// Importa funciones de date-fns
import { differenceInDays, parseISO, format, isValid, isPast, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Importa iconos de React-Icons
import { FaCalendarAlt, FaFlagCheckered, FaChartLine, FaExclamationTriangle, FaEdit, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';
import { IoBarChartSharp } from 'react-icons/io5';

// Importa el componente de la gráfica de línea para la evolución
import ProgressLineChart from '../components/charts/ProgressLineChart';

function GoalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Nuevo estado para el período de tiempo seleccionado
    const [timeframe, setTimeframe] = useState('all_time'); // '7_days', '30_days', '90_days', 'all_time', '1_year'

    // ************************************************************
    // *** INICIO DE LAS DECLARACIONES DE useMemo y FUNCIONES ***
    // ************************************************************

    const calculateProgress = useMemo(() => {
        if (!goalData) return 0;

        const initialValue = parseFloat(goalData.valor_inicial_numerico);
        const targetValue = parseFloat(goalData.valor_cuantitativo);
        const isLowerBetter = goalData.es_menor_mejor;

        let currentValue = parseFloat(goalData.valor_actual);
        if (isNaN(currentValue)) {
            currentValue = initialValue;
        }

        if (isNaN(initialValue) || isNaN(targetValue) || isNaN(currentValue)) {
            console.warn("calculateProgress: Valores numéricos inválidos o faltantes. Inicial:", goalData.valor_inicial_numerico, "Meta:", goalData.valor_cuantitativo, "Actual:", goalData.valor_actual);
            return 0;
        }

        let progress = 0;

        if (isLowerBetter) { // Menor es mejor (ej. de 600 a 500)
            // Si el valor inicial ya es menor o igual al objetivo, se considera 100% si el actual también lo es
            // o 0% si el actual ya está "por encima" de la meta, pero no puede bajar más.
            if (initialValue <= targetValue) {
                // Si el objetivo ya se cumplió o es "imposible" bajar más allá del target,
                // se considera 100% si el valor actual está en o por debajo del objetivo.
                // Si el valor actual está por encima del inicial (lo cual sería un retroceso), es 0%.
                if (currentValue <= targetValue) return 100; // Si ya llegamos o superamos la meta
                if (currentValue >= initialValue) return 0; // Si estamos por encima o en el inicial (retroceso)
                // Si estamos entre target e initial (ej: initial=400, target=300, current=350).
                // Aunque initial <= target ya se atrapa arriba, esta línea no debería ser alcanzada aquí
                // a menos que initialValue === targetValue y currentValue > initialValue.
                // En este caso, el rango es 0, y si el valor actual es mayor, no hay progreso.
                return 0;
            }

            // Caso estándar "menor es mejor": initialValue > targetValue
            const totalRange = initialValue - targetValue; // Ej: 600 (inicio) - 500 (meta) = 100
            const progressMade = initialValue - currentValue; // Ej: 600 (inicio) - 550 (actual) = 50

            if (totalRange <= 0) { // Evitar división por cero o rango inválido
                return (currentValue <= targetValue) ? 100 : 0;
            }

            progress = (progressMade / totalRange) * 100;

        } else { // Mayor es mejor (ej. de 100 a 200)
            // Si el valor inicial ya es mayor o igual al objetivo, se considera 100% si el actual también lo es
            // o 0% si el actual ya está "por debajo" de la meta, pero no puede subir más.
            if (initialValue >= targetValue) {
                // Si el objetivo ya se cumplió o es "imposible" subir más allá del target,
                // se considera 100% si el valor actual está en o por encima del objetivo.
                // Si el valor actual está por debajo del inicial (lo cual sería un retroceso), es 0%.
                if (currentValue >= targetValue) return 100; // Si ya llegamos o superamos la meta
                if (currentValue <= initialValue) return 0; // Si estamos por debajo o en el inicial (retroceso)
                // Similar al caso anterior, esta línea no debería ser alcanzada a menos que initialValue === targetValue
                // y currentValue < initialValue. En este caso, el rango es 0, y si el actual es menor, no hay progreso.
                return 0;
            }

            // Caso estándar "mayor es mejor": targetValue > initialValue
            const totalRange = targetValue - initialValue; // Ej: 200 (meta) - 100 (inicio) = 100
            const progressMade = currentValue - initialValue; // Ej: 150 (actual) - 100 (inicio) = 50

            if (totalRange <= 0) { // Evitar división por cero o rango inválido
                return (currentValue >= targetValue) ? 100 : 0;
            }

            progress = (progressMade / totalRange) * 100;
        }

        // Asegurarse de que el progreso esté entre 0 y 100
        return Math.max(0, Math.min(100, progress));
    }, [goalData]);

    const { daysRemaining, dailyAverageNeeded, statusTrend, isPastDue } = useMemo(() => {
        let daysRemaining = 'N/A';
        let daysElapsed = 'N/A';
        let dailyAverageNeeded = 'N/A';
        let statusTrend = 'N/A';

        const startDate = goalData?.fecha_inicio && isValid(parseISO(goalData.fecha_inicio)) ? parseISO(goalData.fecha_inicio) : null;
        const endDate = goalData?.fecha_fin && isValid(parseISO(goalData.fecha_fin)) ? parseISO(goalData.fecha_fin) : null;
        const today = new Date();

        const isPastDueCalc = isValid(endDate) && isPast(endDate) && (goalData.estado !== 'Completado' && calculateProgress < 100);

        if (isValid(startDate) && isValid(endDate)) {
            const totalDurationDays = differenceInDays(endDate, startDate) + 1;

            if (isPast(endDate)) {
                if (isPastDueCalc) {
                    daysRemaining = 'Vencido';
                } else if (goalData.estado === 'Completado' || calculateProgress === 100) {
                    daysRemaining = 'Completado';
                }
                daysElapsed = totalDurationDays;
            } else if (isPast(startDate) && !isPast(endDate)) {
                daysRemaining = differenceInDays(endDate, today);
                daysElapsed = differenceInDays(today, startDate) + 1;
            } else if (!isPast(startDate)) {
                daysRemaining = totalDurationDays;
                daysElapsed = 0;
            }
        } else if (isValid(startDate) && !endDate) {
            if (isPast(startDate)) {
                daysElapsed = differenceInDays(today, startDate) + 1;
            } else {
                daysElapsed = 0;
            }
        }

        const initialValue = Number(goalData?.valor_inicial_numerico || 0);
        const targetValue = Number(goalData?.valor_cuantitativo || 0);
        const currentValue = (goalData?.valor_actual !== null && goalData?.valor_actual !== undefined && !isNaN(Number(goalData?.valor_actual)))
            ? Number(goalData.valor_actual)
            : initialValue;
        const isLowerBetter = goalData?.es_menor_mejor;

        const isQuantitative = (
            goalData?.valor_cuantitativo !== null && goalData?.valor_cuantitativo !== undefined && !isNaN(Number(goalData.valor_cuantitativo)) &&
            goalData?.valor_inicial_numerico !== null && goalData?.valor_inicial_numerico !== undefined && !isNaN(Number(goalData.valor_inicial_numerico))
        );

        if (isQuantitative && isValid(startDate) && isValid(endDate)) {
            const totalRange = Math.abs(targetValue - initialValue);
            const totalDurationDays = differenceInDays(endDate, startDate) + 1;

            if (totalDurationDays > 0) {
                const requiredDailyChange = totalRange / totalDurationDays;

                let currentProgressDelta = 0;
                if (isLowerBetter) {
                    currentProgressDelta = initialValue - currentValue;
                } else {
                    currentProgressDelta = currentValue - initialValue;
                }

                const actualDaysElapsed = daysElapsed === 'N/A' ? 0 : daysElapsed;
                const expectedProgressDelta = requiredDailyChange * actualDaysElapsed;

                if (calculateProgress === 100) {
                    statusTrend = 'Completado';
                } else if (isPastDueCalc) {
                    statusTrend = 'Finalizado (No alcanzado)';
                } else if (
                    (isLowerBetter && currentProgressDelta >= expectedProgressDelta) ||
                    (!isLowerBetter && currentProgressDelta >= expectedProgressDelta)
                ) {
                    statusTrend = 'Al alza';
                } else {
                    statusTrend = 'A la baja';
                }

                dailyAverageNeeded = `${requiredDailyChange.toFixed(1)} ${goalData.unidad_medida || ''}/día`;
            } else {
                dailyAverageNeeded = 'N/A';
                statusTrend = (calculateProgress === 100) ? 'Completado' : 'No aplica';
            }
        } else if (isQuantitative) {
            dailyAverageNeeded = 'N/A';
            statusTrend = (calculateProgress === 100) ? 'Completado' : 'N/A';
        } else {
            dailyAverageNeeded = 'N/A';
            statusTrend = 'N/A';
        }

        return { daysRemaining, dailyAverageNeeded, statusTrend, isPastDue: isPastDueCalc };
    }, [goalData, calculateProgress]);

    const isQuantitativeGoal = useMemo(() => {
        if (!goalData) {
            return false;
        }

        return (
            (goalData.valor_cuantitativo !== null && goalData.valor_cuantitativo !== undefined && !isNaN(Number(goalData.valor_cuantitativo))) &&
            (goalData.valor_inicial_numerico !== null && goalData.valor_inicial_numerico !== undefined && !isNaN(Number(goalData.valor_inicial_numerico)))
        );
    }, [goalData]);

    const handleDeleteGoal = async () => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este objetivo?")) {
            try {
                setLoading(true);
                await apiService.deleteObjective(id);
                toast.success("Objetivo eliminado con éxito.");
                navigate('/');
            } catch (err) {
                console.error("Error al eliminar el objetivo:", err);
                toast.error(`Error al eliminar el objetivo: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    // Función para manejar el cambio del selector de período de tiempo
    const handleTimeframeChange = useCallback((event) => {
        setTimeframe(event.target.value);
    }, []);

    // ************************************************************
    // *** FIN DE LAS DECLARACIONES DE useMemo y FUNCIONES ***
    // ************************************************************


    const fetchGoalDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getObjectiveById(id);

            // console.log("------------------- FETCH GOAL DETAILS LOGS -------------------");
            // console.log("1. Datos del objetivo REALES del backend (data):", data);

            let chartProgressData = [];

            // 1. Añadir el valor inicial del objetivo como el primer punto del gráfico
            const initialDateString = data.createdAt;
            const isInitialDateValid = initialDateString && isValid(parseISO(initialDateString));

            if (data.valor_inicial_numerico !== null && data.valor_inicial_numerico !== undefined && isInitialDateValid) {
                const initialValueParsed = parseFloat(data.valor_inicial_numerico);
                if (!isNaN(initialValueParsed)) {
                    chartProgressData.push({
                        date: initialDateString,
                        value: initialValueParsed
                    });
                    // console.log("2. Gráfico: Primer punto (Valor Inicial) añadido:", chartProgressData[0]);
                } else {
                    // console.warn("2. Gráfico: valor_inicial_numerico no es un número válido (NaN o null/undefined):", data.valor_inicial_numerico);
                }
            } else {
                // console.log("2. Gráfico: No se añadió el punto inicial (createdAt inválida o faltante).");
                // console.log("DEBUG: createdAt:", data.createdAt, "isInitialDateValid:", isInitialDateValid);
            }

            // 3. Añadir todos los registros de historial de progreso que vienen del backend
            const backendProgressArray = data.historial_progreso || data.progresos;

            if (backendProgressArray && Array.isArray(backendProgressArray) && backendProgressArray.length > 0) {
                // console.log(`DEBUG: Se encontró historial de progreso con el nombre: ${data.historial_progreso ? "historial_progreso" : "progresos"}. Cantidad de entradas: ${backendProgressArray.length}`);
                backendProgressArray.forEach(entry => {
                    const valueParsed = parseFloat(entry.value);
                    const entryDateString = entry.date;
                    if (entryDateString && !isNaN(valueParsed) && isValid(parseISO(entryDateString))) {
                        chartProgressData.push({
                            date: entryDateString,
                            value: valueParsed
                        });
                        // console.log("3. Gráfico: Entrada de progreso VÁLIDA añadida:", {date: entry.date, value: valueParsed});
                    } else {
                        // console.warn("3. Gráfico: Entrada de progreso inválida (fecha o valor faltante/NaN):", entry);
                        // console.log("DEBUG: entry.date:", entry.date, "isValid(parseISO(entryDateString)):", entryDateString && isValid(parseISO(entryDateString)), "valueParsed:", valueParsed, "isNaN(valueParsed):", isNaN(valueParsed));
                    }
                });
                // console.log("3. Gráfico: Puntos de historial REALES del backend añadidos. Total hasta ahora:", chartProgressData.length);
            } else {
                // console.log("3. Gráfico: No hay registros de historial de progreso del backend o el array está vacío, o la propiedad no se llama ni 'historial_progreso' ni 'progresos'.");
                // console.log("DEBUG: Contenido de data.historial_progreso:", data.historial_progreso);
                // console.log("DEBUG: Contenido de data.progresos:", data.progresos);
            }

            // 4. Añadir el valor actual del objetivo si es diferente al último punto y más reciente
            const updateDateString = data.updatedAt;
            const isUpdateDateValid = updateDateString && isValid(parseISO(updateDateString));

            if (data.valor_actual !== null && data.valor_actual !== undefined && isUpdateDateValid) {
                const currentValueParsed = parseFloat(data.valor_actual);
                const lastChartEntry = chartProgressData[chartProgressData.length - 1];

                let shouldAddCurrentValue = false;
                if (!isNaN(currentValueParsed)) {
                    if (!lastChartEntry) {
                        shouldAddCurrentValue = true;
                    } else {
                        const lastEntryDate = parseISO(lastChartEntry.date);
                        const currentObjectiveUpdateDate = parseISO(updateDateString);

                        if (currentObjectiveUpdateDate.getTime() > lastEntryDate.getTime()) {
                            shouldAddCurrentValue = true;
                        } else if (format(currentObjectiveUpdateDate, 'yyyy-MM-dd') === format(lastEntryDate, 'yyyy-MM-dd')) {
                            if (currentValueParsed !== lastChartEntry.value) {
                                shouldAddCurrentValue = true;
                            }
                        }
                    }
                } else {
                    // console.warn("4. Gráfico: valor_actual del objetivo no es un número válido (NaN o null/undefined):", data.valor_actual);
                }

                if (shouldAddCurrentValue) {
                    chartProgressData.push({
                        date: updateDateString,
                        value: currentValueParsed
                    });
                    // console.log("4. Gráfico: Último Valor Actual del objetivo añadido (si es diferente/más reciente). Total hasta ahora:", chartProgressData.length);
                } else {
                    // console.log("4. Gráfico: El último valor actual no se añadió (no es diferente/más reciente o inválido).");
                }
            } else {
                // console.log("4. Gráfico: No se pudo añadir el último valor actual del objetivo (missing o inválido).");
                // console.log("DEBUG: valor_actual:", data.valor_actual, "updatedAt:", data.updatedAt, "isUpdateDateValid:", isUpdateDateValid);
            }


            // 5. Ordenar y consolidar puntos por fecha (manteniendo el último valor del día)
            chartProgressData.sort((a, b) => {
                const dateA = a.date ? parseISO(a.date) : new Date(0);
                const dateB = b.date ? parseISO(b.date) : new Date(0);
                return dateA.getTime() - dateB.getTime();
            });

            const dailyValuesMap = new Map();

            chartProgressData.forEach(entry => {
                if (entry.date && isValid(parseISO(entry.date))) {
                    const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
                    dailyValuesMap.set(dateKey, entry);
                }
            });

            let finalChartData = Array.from(dailyValuesMap.values()).sort((a, b) => {
                const dateA = a.date ? parseISO(a.date) : new Date(0);
                const dateB = b.date ? parseISO(b.date) : new Date(0);
                return dateA.getTime() - dateB.getTime();
            });

            data.historial_progreso = finalChartData;

            setGoalData(data);
            // console.log("7. Estado de goalData actualizado:", data);
            // console.log("---------------------------------------------------------------");

        } catch (err) {
            console.error("Error al cargar los detalles del objetivo:", err);
            setError("No se pudo cargar el objetivo. Por favor, inténtalo de nuevo más tarde.");
            toast.error("Error al cargar los detalles del objetivo.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchGoalDetails();
        }
    }, [id, fetchGoalDetails]);

    // Lógica para filtrar los datos del historial de progreso según el timeframe
    const filteredProgressHistory = useMemo(() => {
        if (!goalData?.historial_progreso) {
            return [];
        }

        const today = new Date();
        let startDateFilter = null;

        switch (timeframe) {
            case '7_days':
                startDateFilter = subDays(today, 6); // Incluye hoy
                break;
            case '30_days':
                startDateFilter = subDays(today, 29); // Incluye hoy
                break;
            case '90_days':
                startDateFilter = subDays(today, 89); // Incluye hoy
                break;
            case '1_year':
                startDateFilter = subDays(today, 364); // Incluye hoy
                break;
            case 'all_time':
            default:
                return goalData.historial_progreso; // No se filtra, se usan todos los datos
        }

        // Si hay una fecha de inicio de filtro, nos aseguramos de que el primer punto de datos sea el valor inicial
        // o el valor más antiguo dentro del rango, para que la gráfica comience correctamente.
        let filteredData = goalData.historial_progreso.filter(entry => {
            const entryDate = parseISO(entry.date);
            return isValid(entryDate) && entryDate.getTime() >= startDateFilter.getTime();
        });

        // Asegurarse de incluir el punto más antiguo que es anterior al `startDateFilter` si es relevante
        // para dar contexto a la gráfica, o el primer punto si no hay ninguno dentro del rango.
        if (filteredData.length > 0) {
            const firstFilteredDate = parseISO(filteredData[0].date);
            const oldestAvailablePoint = goalData.historial_progreso[0]; // El primer punto real, que es el más antiguo
            const oldestAvailableDate = oldestAvailablePoint ? parseISO(oldestAvailablePoint.date) : null;

            // Si el primer punto filtrado no es el punto más antiguo del historial,
            // y el punto más antiguo está antes de la fecha de inicio del filtro,
            // necesitamos añadir el punto más antiguo o un punto inmediatamente anterior si está disponible.
            // Para la mayoría de los casos de "últimos N días", el primer punto *dentro* del rango es suficiente.
            // La lógica de Chart.js y `calculateNiceScale` ya maneja bien los rangos.
            // Aquí la clave es si *no hay puntos* dentro del rango, o si el primer punto filtrado es el único.

            // Si el primer punto filtrado NO coincide con el primer punto del historial COMPLETO
            // Y el filtro es un rango de tiempo (no 'all_time'), y el primer punto del historial es anterior al rango,
            // entonces agregamos el primer punto del historial para asegurar que la gráfica comience correctamente
            // desde un valor conocido si los datos empiezan antes del rango visible.
            if (oldestAvailablePoint && isValid(oldestAvailableDate) &&
                startDateFilter && oldestAvailableDate.getTime() < startDateFilter.getTime() &&
                (filteredData.length === 0 || parseISO(filteredData[0].date).getTime() > oldestAvailableDate.getTime())
            ) {
                // Añadir el punto anterior al rango para que la línea de la gráfica no empiece "de la nada"
                // sino que venga del punto más cercano anterior.
                // Buscamos el último punto antes de startDateFilter
                const lastPointBeforeFilter = goalData.historial_progreso.reduce((prev, current) => {
                    const currentDate = parseISO(current.date);
                    if (isValid(currentDate) && currentDate.getTime() < startDateFilter.getTime()) {
                        return current;
                    }
                    return prev;
                }, null);

                if (lastPointBeforeFilter) {
                    filteredData.unshift(lastPointBeforeFilter);
                }
            }

            // Si después de todo el filtrado, solo tenemos 1 punto, la gráfica no se renderizará bien (necesita al menos 2).
            // En ese caso, si tenemos el `valor_inicial_numerico` y su fecha de creación, podemos usarlo como segundo punto.
            // PERO, es mejor que `ProgressLineChart` maneje el mensaje de "datos insuficientes" si no hay al menos 2 puntos significativos.
        }

        return filteredData;
    }, [goalData, timeframe]); // Depende de goalData y timeframe


    const finalProgressPercentage = goalData?.estado === 'Completado' ? 100 : calculateProgress;
    const progressRemaining = 100 - finalProgressPercentage;

    const handleEditClick = () => {
        navigate(`/objectives/edit/${id}`);
    };


    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <LoadingSpinner />
                <p>Cargando detalles del objetivo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                <p>{error}</p>
                <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
            </div>
        );
    }

    if (!goalData) {
        return (
            <div className={styles.pageContainer}>
                <p>No se encontró el objetivo.</p>
                <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.displayModeContent}>
                <div className={styles.header}>
                    <div className={styles.goalTitleContainer}>
                        <h1 className={styles.goalName}>{goalData.nombre}</h1>
                        {goalData.tipo_objetivo && (
                            <span className={styles.categoryTag}>{goalData.tipo_objetivo}</span>
                        )}
                        <p className={styles.goalDescriptionText}>{goalData.descripcion || 'Sin descripción.'}</p>
                    </div>
                    <div className={styles.headerActions}>
                        <button onClick={handleEditClick} disabled={loading} className={styles.editButton}>
                            <FaEdit /> Editar
                        </button>
                        <button onClick={() => navigate(`/objectives/${id}/update-progress`)} disabled={loading} className={styles.updateProgressButton}>
                            <FaPlusCircle /> Actualizar Progreso
                        </button>
                        <button onClick={handleDeleteGoal} disabled={loading} className={styles.deleteButton}>
                            <FaTrashAlt /> Eliminar
                        </button>
                    </div>
                </div>

                {isPastDue && goalData.fecha_fin && (
                    <div className={styles.overdueMessage}>
                        <FaExclamationTriangle className={styles.overdueIcon} />
                        <p>¡Atención! Este objetivo ha **vencido** y no se ha completado.</p>
                        <p>Días pasados desde la fecha límite: {Math.abs(daysRemaining)}</p>
                    </div>
                )}

                <div className={styles.topCardsGrid}>
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <h2 className={styles.cardTitle}>Progreso</h2>
                        {isQuantitativeGoal ? (
                            <>
                                <div className={styles.progressChartWrapper}>
                                    <GoalProgressChart progressPercentage={finalProgressPercentage} />
                                </div>
                                <div className={styles.progressValues}>
                                    <div className={styles.progressValueItem}>
                                        <span className={styles.valueLabel}>Actual</span>
                                        <span className={styles.valueNumber}>
                                            {Number(goalData.valor_actual !== null && goalData.valor_actual !== undefined && !isNaN(Number(goalData.valor_actual)) ? goalData.valor_actual : goalData.valor_inicial_numerico || 0).toFixed(1)} {goalData.unidad_medida || ''}
                                        </span>
                                    </div>
                                    <div className={styles.progressValueItem}>
                                        <span className={styles.valueLabel}>Meta</span>
                                        <span className={styles.valueNumber}>
                                            {Number(goalData.valor_cuantitativo || 0).toFixed(0)} {goalData.unidad_medida || ''}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className={styles.noDataMessage}>Este objetivo no es cuantitativo o no tiene los valores necesarios para calcular el progreso.</p>
                        )}
                    </div>

                    <div className={`${styles.card} ${styles.dataCard}`}>
                        <h2 className={styles.cardTitle}>Datos Clave</h2>
                        <div className={styles.dataList}>
                            <div className={styles.dataListItem}>
                                <FaCalendarAlt className={styles.icon} />
                                <span className={styles.dataLabel}>Fecha Inicio</span>
                                <span className={styles.dataValue}>{goalData.fecha_inicio && isValid(parseISO(goalData.fecha_inicio)) ? format(parseISO(goalData.fecha_inicio), 'd/M/yyyy', { locale: es }) : 'N/A'}</span>
                            </div>
                            <div className={styles.dataListItem}>
                                <FaFlagCheckered className={styles.icon} />
                                <span className={styles.dataLabel}>Fecha Límite</span>
                                <span className={styles.dataValue}>{goalData.fecha_fin && isValid(parseISO(goalData.fecha_fin)) ? format(parseISO(goalData.fecha_fin), 'd/M/yyyy', { locale: es }) : 'N/A'}</span>
                            </div>
                            <div className={styles.dataListItem}>
                                <FiClock className={styles.icon} />
                                <span className={styles.dataLabel}>Días Restantes</span>
                                <span className={`${styles.dataValue} ${daysRemaining === 'Vencido' ? styles.overdue : ''}`}>
                                    {daysRemaining}
                                </span>
                            </div>

                            {isQuantitativeGoal && (
                                <>
                                    <div className={styles.dataListItem}>
                                        <IoBarChartSharp className={styles.icon} />
                                        <span className={styles.dataLabel}>Tasa Promedio</span>
                                        <span className={styles.dataValue}>{dailyAverageNeeded}</span>
                                    </div>
                                    <div className={styles.dataListItem}>
                                        {statusTrend === 'Al alza' && <FiTrendingUp className={`${styles.icon} ${styles.trendUp}`} />}
                                        {statusTrend === 'A la baja' && <FiTrendingDown className={`${styles.icon} ${styles.trendDown}`} />}
                                        {statusTrend === 'Completado' && <FaChartLine className={`${styles.icon} ${styles.trendCompleted}`} />}
                                        {(statusTrend === 'N/A' || statusTrend === 'No aplica' || statusTrend === 'Finalizado (No alcanzado)') && <FaChartLine className={styles.icon} />}

                                        <span className={styles.dataLabel}>Tendencia</span>
                                        <span className={styles.dataValue}>{statusTrend}</span>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.distributionCard}`}>
                        <h2 className={styles.cardTitle}>Distribución</h2>
                        {isQuantitativeGoal ? (
                            <>
                                <div className={styles.barChartPlaceholder}>
                                    <div className={styles.completedBar} style={{ height: `${finalProgressPercentage}%` }}>
                                        <span className={styles.barValue}>{Math.round(finalProgressPercentage)}%</span>
                                    </div>
                                    <div className={styles.remainingBar} style={{ height: `${progressRemaining}%` }}>
                                        <span className={styles.barValue}>{Math.round(progressRemaining)}%</span>
                                    </div>
                                </div>
                                <div className={styles.distributionLabels}>
                                    <div className={styles.distributionLabelItem}>Completado</div>
                                    <div className={styles.distributionLabelItem}>Restante</div>
                                </div>
                            </>
                        ) : (
                            <p className={styles.noDataMessage}>No hay datos cuantitativos para la distribución.</p>
                        )}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.progressHistoryCard}`}>
                    <h2 className={styles.cardTitle}>Evolución del Progreso</h2>
                    <div className={styles.progressHistoryHeader}>
                        {/* Selector para el período de tiempo */}
                        <select
                            className={styles.timeframeSelect}
                            value={timeframe}
                            onChange={handleTimeframeChange}
                        >
                            <option value="7_days">Últimos 7 días</option>
                            <option value="30_days">Último Mes</option>
                            <option value="90_days">Últimos 3 Meses</option>
                            <option value="1_year">Último Año</option>
                            <option value="all_time">Todo el tiempo</option>
                        </select>
                    </div>
                    <div className={styles.chartArea}>
                        {isQuantitativeGoal && filteredProgressHistory.length >= 2 ? (
                            <ProgressLineChart
                                progressHistory={filteredProgressHistory} // Pasamos los datos filtrados
                                unitMeasure={goalData.unidad_medida}
                                targetValue={parseFloat(goalData.valor_cuantitativo)}
                                isLowerBetter={goalData.es_menor_mejor}
                            />
                        ) : (
                            <p className={styles.noDataMessage}>
                                {isQuantitativeGoal
                                    ? `No hay datos suficientes para mostrar la evolución del progreso en el período seleccionado (se requieren al menos 2 puntos). Actualmente tienes ${filteredProgressHistory.length} puntos en este rango.`
                                    : "La evolución del progreso solo está disponible para objetivos cuantitativos."}
                            </p>
                        )}
                    </div>
                </div>

                <Button onClick={() => navigate('/dashboard')} className={styles.backButton}>
                    Volver al Dashboard
                </Button>
            </div>
        </div>
    );
}

export default GoalDetailPage;