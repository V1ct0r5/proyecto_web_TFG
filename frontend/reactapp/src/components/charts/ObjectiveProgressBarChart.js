import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// NOTA: ChartJS.register DEBE realizarse una única vez de forma global en la aplicación.
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BAR_HEIGHT_ESTIMATED_PX = 35; // Estimación de altura por barra para cálculo de minHeight
const MIN_CHART_HEIGHT_PX = 200; // Altura mínima del gráfico

// TODO: Considerar una utilidad de color más robusta para generar borderColors si item.color puede variar en formato.
const ObjectiveProgressBarChart = ({ data }) => { // data: [{ name: 'Correr 5km', progress: 70, color: '#4F46E5' }, ...]
    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item.name);
        const progressValues = data.map(item => item.progress);
        const backgroundColors = data.map(item => item.color || 'rgba(79, 70, 229, 0.7)');
        // Lógica de borde simplificada, asume que si item.color se provee, es el color base.
        // Idealmente, se usaría una utilidad para oscurecer o hacer opaco item.color.
        const borderColors = data.map(item => item.color ? item.color.split(',')[0].replace('rgba', 'rgb') + ')' : '#4F46E5');


        return {
            labels,
            datasets: [{
                label: 'Progreso del Objetivo (%)',
                data: progressValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }],
        };
    }, [data]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>No hay datos de progreso de objetivos para mostrar.</p>;
    }

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Progreso (%)'
                },
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                }
            },
            y: {
                ticks: {
                    autoSkip: false,
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label || ''}: ${context.parsed.x ? context.parsed.x.toFixed(1) : 0}%`;
                    }
                }
            }
        },
    };

    const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, (data?.length || 0) * BAR_HEIGHT_ESTIMATED_PX);

    // TODO: Mover estos estilos a un archivo CSS module.
    return (
        <div style={{ height: '100%', minHeight: `${chartHeight}px`, width: '100%', position: 'relative' }}>
            <Bar data={processedChartData} options={options} />
        </div>
    );
};

export default ObjectiveProgressBarChart;