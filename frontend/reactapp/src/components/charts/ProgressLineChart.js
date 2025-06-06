// src/components/charts/ProgressLineChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale'; // Importar ambos locales
import annotationPlugin from 'chartjs-plugin-annotation';
import { useTranslation } from 'react-i18next';

// Registrar el plugin de anotaciones
ChartJS.register(annotationPlugin);

// Registrar los componentes de Chart.js que vamos a usar, incluyendo Filler
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Helper function to create a gradient (will be called within the component)
const createGradient = (ctx, chartArea) => {
    if (!ctx || !chartArea) return null;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0)');
    gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.2)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.4)');
    return gradient;
};

// Función para calcular un stepSize "bonito" y ajustar el min/max a sus múltiplos
const calculateNiceScale = (minData, maxData, desiredTicks = 5) => {
    let range = maxData - minData;

    // Asegurar un rango mínimo para evitar stepSize de 0 o muy pequeños
    if (range <= 0) {
        range = 10; // Rango por defecto si los datos son iguales o muy cercanos
        maxData = maxData + 5; // Ajustar maxData para que haya un rango
        minData = Math.max(0, minData - 5); // Ajustar minData para que haya un rango, no negativo
    }

    // Calcular una estimación de stepSize
    const roughStep = range / (desiredTicks - 1);

    // Encontrar el valor "bonito" más cercano
    const exponent = Math.floor(Math.log10(roughStep));
    const fraction = roughStep / Math.pow(10, exponent);

    let niceFraction;
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7.5) niceFraction = 5;
    else niceFraction = 10;

    const stepSize = niceFraction * Math.pow(10, exponent);

    // Ajustar yAxisMin para que sea un múltiplo "bonito" del stepSize y no sea negativo
    let yAxisMin = Math.floor(minData / stepSize) * stepSize;
    if (yAxisMin < 0) yAxisMin = 0; // Asegurarse de que el mínimo nunca sea negativo

    // Ajustar yAxisMax para que sea un múltiplo "bonito" del stepSize
    let yAxisMax = Math.ceil(maxData / stepSize) * stepSize;
    // Si el yAxisMax calculado es igual o menor que el yAxisMin, añadir un paso
    if (yAxisMax <= yAxisMin) {
        yAxisMax = yAxisMin + stepSize;
    }

    return { yAxisMin, yAxisMax, stepSize };
};


// Componente de la gráfica de líneas de progreso
function ProgressLineChart({ progressHistory, unitMeasure, targetValue, isLowerBetter }) {
    const { t, i18n } = useTranslation();
    const chartRef = React.useRef(null);
    const [chartData, setChartData] = React.useState({ labels: [], datasets: [] });
    const [chartOptions, setChartOptions] = React.useState({});

    // Mapeo de idiomas de i18next a locales de date-fns
    const dateFnsLocales = {
        es: es,
        en: enUS
    };
    const currentLocale = dateFnsLocales[i18n.language] || enUS;
    
    // Mapeo de idiomas de i18next a formatos de Intl.NumberFormat
    const numberFormatLocales = {
        es: 'es-ES',
        en: 'en-US'
    };
    const currentNumberLocale = numberFormatLocales[i18n.language] || 'en-US';

    const hasTargetValue = targetValue !== undefined && targetValue !== null && !isNaN(targetValue);

    React.useEffect(() => {
        if (!progressHistory) return;

        if (progressHistory.length < 2 && !hasTargetValue) {
            setChartData({ labels: [], datasets: [] });
            return;
        }

        const sortedHistory = [...progressHistory].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const labels = sortedHistory.map(item =>
            format(parseISO(item.date), 'd/M', { locale: currentLocale })
        );

        const dataValues = sortedHistory.map(item => item.value);

        const actualMin = dataValues.length > 0 ? Math.min(...dataValues) : 0;
        const actualMax = dataValues.length > 0 ? Math.max(...dataValues) : 0;
        
        let displayMin = actualMin;
        let displayMax = actualMax;

        // Incorporar el targetValue en el rango de visualización si es relevante
        if (hasTargetValue) {
            if (isLowerBetter) {
                // Si menor es mejor, la meta es un valor bajo. El máximo de visualización debe incluir el valor inicial o más alto.
                displayMax = Math.max(displayMax, targetValue * 1.05); // Considera la meta con un poco de padding
                displayMin = Math.min(displayMin, targetValue); // La meta podría ser el nuevo mínimo si es muy baja
            } else {
                // Si mayor es mejor, la meta es un valor alto.
                // Asegurarse de que el rango de visualización incluya la meta
                displayMax = Math.max(displayMax, targetValue);
                displayMin = Math.min(displayMin, targetValue * 0.95); // La meta podría ser el nuevo máximo si es muy alta
            }
        }
        
        // Asegurarse de que displayMin no sea negativo
        displayMin = Math.max(0, displayMin);

        // Si los datos son muy cercanos, asegurar un rango mínimo para calculateNiceScale
        if (displayMax - displayMin < 1 && displayMax === displayMin) {
            displayMax = displayMax + 1; // Añadir un mínimo de 1 al rango
            if (displayMin > 0) displayMin = Math.max(0, displayMin - 1); // Si displayMin es 0, no lo bajes
        }


        // *******************************************************************
        // CAMBIO CLAVE: Usar calculateNiceScale para obtener min, max y stepSize
        // *******************************************************************
        const { yAxisMin, yAxisMax, stepSize } = calculateNiceScale(displayMin, displayMax, 5);


        const datasets = [
            {
                label: t('charts.progressLabelWithUnit', { unit: unitMeasure ? `(${unitMeasure})` : '' }),
                data: dataValues,
                borderColor: 'rgb(102, 126, 234)',
                tension: 0.4,
                fill: true,
                pointStyle: 'circle',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(102, 126, 234)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                pointHoverBorderColor: 'rgb(102, 126, 234)',
                pointHoverBorderWidth: 2,
            },
        ];

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 10,
                    top: 10,
                    bottom: 0
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat(currentNumberLocale, { maximumFractionDigits: 1 }).format(context.parsed.y);
                                if (unitMeasure) { label += ` ${unitMeasure}`; }
                            }
                            return label;
                        },
                        title: function(context) {
                            return format(parseISO(sortedHistory[context[0].dataIndex].date), 'dd MMMM', { locale: currentLocale });
                        }
                    },
                    displayColors: false,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 4,
                },
                annotation: {
                    annotations: {
                        ...(hasTargetValue && {
                            line1: {
                                type: 'line',
                                yMin: targetValue,
                                yMax: targetValue,
                                borderColor: 'rgb(255, 165, 0)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: { enabled: false }
                            }
                        })
                    }
                }
            },
            scales: {
                x: {
                    title: { display: false },
                    ticks: {
                        color: 'var(--muted-foreground)',
                        autoSkip: true, maxRotation: 0, minRotation: 0,
                        font: { size: 12 },
                    },
                    grid: { display: false, drawOnChartArea: false, drawBorder: false }
                },
                y: {
                    title: { display: false },
                    ticks: {
                        color: 'var(--muted-foreground)',
                        callback: function(value) {
                            if (Math.abs(value) >= 1000) {
                                return new Intl.NumberFormat(currentNumberLocale, { maximumFractionDigits: 1, notation: 'compact', compactDisplay: 'short' }).format(value) + ` ${unitMeasure || ''}`;
                            }
                            return new Intl.NumberFormat(currentNumberLocale, { maximumFractionDigits: 1 }).format(value) + ` ${unitMeasure || ''}`;
                        },
                        font: { size: 12 },
                        padding: 10,
                        stepSize: stepSize, // ¡Ahora el stepSize viene de calculateNiceScale!
                        // El `max` del tick ya no es tan crítico aquí porque `yAxisMax` ya es un múltiplo
                        // Pero lo mantenemos si quieres que la meta sea el tick visible *cuando no la has superado*.
                        max: hasTargetValue && !isLowerBetter && actualMax <= targetValue ? targetValue : undefined,
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false,
                    },
                    min: yAxisMin, // ¡Ahora el min viene de calculateNiceScale!
                    max: yAxisMax, // ¡Ahora el max viene de calculateNiceScale!
                }
            }
        };

        setChartData({ labels, datasets });
        setChartOptions(options);

    }, [progressHistory, unitMeasure, targetValue, isLowerBetter, hasTargetValue, t, currentLocale, currentNumberLocale]);


    React.useEffect(() => {
        const chart = chartRef.current;
        if (chart) {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;

            if (chartData.datasets.length > 0 && chartArea) {
                const newDatasets = chartData.datasets.map((dataset, index) => {
                    if (index === 0) {
                        return {
                            ...dataset,
                            backgroundColor: createGradient(ctx, chartArea)
                        };
                    }
                    return dataset;
                });
                setChartData(prev => ({ ...prev, datasets: newDatasets }));
            }
        }
    }, [chartRef, chartData.datasets.length, chartData.labels.length]);

    if (!chartData.labels || chartData.labels.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500" style={{ color: 'var(--muted-foreground)' }}>
                {t('charts.notEnoughDataForChart')}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
    );
}

export default ProgressLineChart;