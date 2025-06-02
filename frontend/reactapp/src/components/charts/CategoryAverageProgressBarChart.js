import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// NOTA: ChartJS.register DEBE realizarse una única vez de forma global en la aplicación.
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ESTIMATED_BAR_HEIGHT_PX = 35;
const MIN_CHART_HEIGHT_PX = 200;

// TODO: Considerar una utilidad de color más robusta para generar borderColors.
// data: [{ categoryName, averageProgress, color }, ...]
const CategoryAverageProgressBarChart = ({ data }) => {
    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item.categoryName);
        const progressValues = data.map(item => item.averageProgress);
        const backgroundColors = data.map(item => item.color || 'rgba(79, 70, 229, 0.7)');
        // Lógica de borde simplificada, asume que si item.color se provee, es el color base.
        const borderColors = data.map(item => (item.color ? item.color.split(',')[0].replace('rgba', 'rgb') + ')' : '#4F46E5'));

        return {
            labels,
            datasets: [{
                label: 'Progreso Promedio (%)',
                data: progressValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }],
        };
    }, [data]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>No hay datos de progreso promedio por categoría.</p>;
    }

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { beginAtZero: true, max: 100, title: { display: true, text: 'Progreso Promedio (%)' }, ticks: { callback: value => value + '%' } },
            y: { ticks: { autoSkip: false } }
        },
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: { callbacks: { label: context => `${context.dataset.label || ''}: ${context.parsed.x ? context.parsed.x.toFixed(1) : 0}%` } }
        },
    };

    const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, (data?.length || 0) * ESTIMATED_BAR_HEIGHT_PX);

    // TODO: Mover estos estilos a un archivo CSS module.
    return (
        <div style={{ height: '100%', minHeight: `${chartHeight}px`, width: '100%', position: 'relative' }}>
            <Bar data={processedChartData} options={options} />
        </div>
    );
};

export default CategoryAverageProgressBarChart;