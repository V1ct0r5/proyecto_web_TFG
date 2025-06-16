import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { format, parseISO, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, annotationPlugin);

const ProgressLineChart = ({ progressHistory, unitMeasure, targetValue, isLowerBetter }) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    const chartDataAndOptions = useMemo(() => {
        if (!progressHistory || progressHistory.length === 0) return null;

        const sortedHistory = [...progressHistory].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        const areAllOnSameDay = sortedHistory.every((entry, index, arr) => 
            index === 0 ? true : isSameDay(parseISO(entry.entryDate), parseISO(arr[0].entryDate))
        );
        
        // --- CORRECCIÓN 1: Formato de hora más explícito ---
        // 'p' es ambiguo, 'HH:mm' es explícito para hora y minutos.
        const labelFormat = areAllOnSameDay ? 'HH:mm' : 'd MMM';

        const data = {
            labels: sortedHistory.map(item => format(parseISO(item.createdAt), labelFormat, { locale: dateLocale })),
            datasets: [{
                label: t('charts.progressLabelWithUnit', { unit: unitMeasure || '' }),
                data: sortedHistory.map(item => item.value),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                fill: true,
                tension: 0.3,
            }],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    title: { 
                        display: true, 
                        text: unitMeasure || t('common.value', 'Valor') 
                    },
                    // --- CORRECCIÓN 2: Invertir el eje Y si es necesario ---
                    reverse: isLowerBetter,
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            const date = parseISO(sortedHistory[tooltipItems[0].dataIndex].createdAt);
                            return format(date, 'PPP p', { locale: dateLocale });
                        }
                    }
                },
                annotation: {
                    annotations: {
                        targetLine: {
                            type: 'line',
                            yMin: targetValue,
                            yMax: targetValue,
                            borderColor: 'rgb(245, 158, 11)',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                content: t('common.target'),
                                enabled: true,
                                position: 'end',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                color: 'black'
                            },
                        },
                    },
                },
            },
        };

        return { data, options };

    }, [progressHistory, unitMeasure, targetValue, isLowerBetter, t, dateLocale]);
    
    if (!progressHistory || progressHistory.length === 0) {
        return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><p>{t('charts.noProgressHistory', 'No hay historial de progreso para mostrar.')}</p></div>;
    }

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <Line data={chartDataAndOptions.data} options={chartDataAndOptions.options} />
        </div>
    );
};

export default ProgressLineChart;