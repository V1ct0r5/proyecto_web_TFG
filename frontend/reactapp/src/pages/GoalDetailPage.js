import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import styles from './GoalDetailPage.module.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GoalProgressChart from '../components/charts/GoalProgressChart';
import DistributionBarChart from '../components/charts/DistributionBarChart';
import Button from '../components/ui/Button';
import { differenceInDays, parseISO, format, isValid, isPast, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCalendarAlt, FaFlagCheckered, FaChartLine, FaExclamationTriangle, FaEdit, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';
import { IoBarChartSharp } from 'react-icons/io5';
import ProgressLineChart from '../components/charts/ProgressLineChart';

function GoalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all_time');

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
            return 0;
        }

        let progress = 0;

        if (isLowerBetter) {
            if (initialValue <= targetValue) {
                if (currentValue <= targetValue) return 100;
                if (currentValue >= initialValue) return 0;
                return 0;
            }
            const totalRange = initialValue - targetValue;
            const progressMade = initialValue - currentValue;
            if (totalRange <= 0) {
                return (currentValue <= targetValue) ? 100 : 0;
            }
            progress = (progressMade / totalRange) * 100;
        } else {
            if (initialValue >= targetValue) {
                if (currentValue >= targetValue) return 100;
                if (currentValue <= initialValue) return 0;
                return 0;
            }
            const totalRange = targetValue - initialValue;
            const progressMade = currentValue - initialValue;
            if (totalRange <= 0) {
                return (currentValue >= targetValue) ? 100 : 0;
            }
            progress = (progressMade / totalRange) * 100;
        }
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
                navigate('/mis-objetivos');
            } catch (err) {
                toast.error(`Error al eliminar el objetivo: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleTimeframeChange = useCallback((event) => {
        setTimeframe(event.target.value);
    }, []);

    const fetchGoalDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getObjectiveById(id);
            let chartProgressData = [];
            const initialDateString = data.createdAt;
            const isInitialDateValid = initialDateString && isValid(parseISO(initialDateString));

            if (data.valor_inicial_numerico !== null && data.valor_inicial_numerico !== undefined && isInitialDateValid) {
                const initialValueParsed = parseFloat(data.valor_inicial_numerico);
                if (!isNaN(initialValueParsed)) {
                    chartProgressData.push({
                        date: initialDateString,
                        value: initialValueParsed
                    });
                }
            }

            const backendProgressArray = data.historial_progreso || data.progresos;
            if (backendProgressArray && Array.isArray(backendProgressArray) && backendProgressArray.length > 0) {
                backendProgressArray.forEach(entry => {
                    const valueParsed = parseFloat(entry.value);
                    const entryDateString = entry.date;
                    if (entryDateString && !isNaN(valueParsed) && isValid(parseISO(entryDateString))) {
                        chartProgressData.push({
                            date: entryDateString,
                            value: valueParsed
                        });
                    }
                });
            }

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
                }
                if (shouldAddCurrentValue) {
                    chartProgressData.push({
                        date: updateDateString,
                        value: currentValueParsed
                    });
                }
            }

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
        } catch (err) {
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

    const filteredProgressHistory = useMemo(() => {
        if (!goalData?.historial_progreso) {
            return [];
        }

        const today = new Date();
        let startDateFilter = null;

        switch (timeframe) {
            case '7_days':
                startDateFilter = subDays(today, 6);
                break;
            case '30_days':
                startDateFilter = subDays(today, 29);
                break;
            case '90_days':
                startDateFilter = subDays(today, 89);
                break;
            case '1_year':
                startDateFilter = subDays(today, 364);
                break;
            case 'all_time':
            default:
                return goalData.historial_progreso;
        }

        let filteredData = goalData.historial_progreso.filter(entry => {
            const entryDate = parseISO(entry.date);
            return isValid(entryDate) && entryDate.getTime() >= startDateFilter.getTime();
        });

        if (filteredData.length > 0) {
            const oldestAvailablePoint = goalData.historial_progreso[0];
            const oldestAvailableDate = oldestAvailablePoint ? parseISO(oldestAvailablePoint.date) : null;

            if (oldestAvailablePoint && isValid(oldestAvailableDate) &&
                startDateFilter && oldestAvailableDate.getTime() < startDateFilter.getTime() &&
                (filteredData.length === 0 || parseISO(filteredData[0].date).getTime() > oldestAvailableDate.getTime())
            ) {
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
        }
        return filteredData;
    }, [goalData, timeframe]);

    const finalProgressPercentage = goalData?.estado === 'Completado' ? 100 : calculateProgress;
    const progressRemaining = 100 - finalProgressPercentage;

    const handleEditClick = () => {
        navigate(`/objectives/edit/${id}`);
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <LoadingSpinner size='large' text='Cargando detalles del objetivo...'/>
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
                        <p>Días pasados desde la fecha límite: {Math.abs(differenceInDays(parseISO(goalData.fecha_fin), new Date()))}</p> {/* Corregido para mostrar días vencidos */}
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
                        <h2 className={styles.cardTitle}>Distribución del Progreso</h2>
                        {isQuantitativeGoal ? (
                            <div className={styles.chartContainer} style={{ height: '150px' }}> {/* Ajusta la altura según necesites */}
                                <DistributionBarChart
                                    completedPercentage={finalProgressPercentage}
                                    remainingPercentage={progressRemaining}
                                    unitMeasure={goalData.unidad_medida || '%'} // Pasar la unidad de medida o '%' por defecto
                                />
                            </div>
                        ) : (
                            <p className={styles.noDataMessage}>No hay datos cuantitativos para la distribución.</p>
                        )}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.progressHistoryCard}`}>
                    <h2 className={styles.cardTitle}>Evolución del Progreso</h2>
                    <div className={styles.progressHistoryHeader}>
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
                                progressHistory={filteredProgressHistory}
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

                <Button onClick={() => navigate('/mis-objetivos')} className={styles.backButton}>
                    Volver a mis objetivos
                </Button>
            </div>
        </div>
    );
}

export default GoalDetailPage;