// frontend/reactapp/src/components/charts/ObjectiveStatusChart.js
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';

// IMPORTANTE: Registra los componentes de Chart.js.
// Idealmente, haz esto UNA VEZ globalmente en tu App.js o un archivo de configuración.
// Si ya lo haces globalmente, puedes omitir esta línea aquí.
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const getStatusChartColors = (statuses) => {
    const defaultColors = [
        'rgba(54, 162, 235, 0.8)', // Azul (En Progreso)
        'rgba(75, 192, 192, 0.8)', // Verde (Completado)
        'rgba(255, 206, 86, 0.8)', // Amarillo (Pendiente)
        'rgba(255, 99, 132, 0.8)', // Rojo (Fallido)
        'rgba(153, 102, 255, 0.8)',// Morado (Archivado)
        'rgba(201, 203, 207, 0.8)' // Gris (Otros)
    ];
    const backgroundColors = statuses.map((status, index) => status.color || defaultColors[index % defaultColors.length]);
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
    return { backgroundColors, borderColors };
};

const ObjectiveStatusChart = ({ data }) => {
    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Estado de Objetivos', data: [],
                    backgroundColor: [], borderColor: [],
                    borderWidth: 1, offset: 8,
                }],
            };
        }
        const labels = data.map(item => item.name);
        const chartValues = data.map(item => item.value);
        const { backgroundColors, borderColors } = getStatusChartColors(data);
        return {
            labels,
            datasets: [{
                label: 'Estado de Objetivos', data: chartValues,
                backgroundColor: backgroundColors, borderColor: borderColors,
                borderWidth: 1, offset: 8,
            }],
        };
    }, [data]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>No hay datos de estados para mostrar.</p>;
    }

    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 10 } },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) label += ': ';
                        if (context.parsed !== null && context.dataset.data.length > 0) {
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            label += `<span class="math-inline">\{context\.raw\} \(</span>{percentage}%)`;
                        } else if (context.raw !== undefined) label += context.raw;
                        return label;
                    }
                }
            }
        },
        cutout: '60%',
    };

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', minHeight: '250px' }}>
            <Doughnut data={processedChartData} options={options} />
        </div>
    );
};

export default ObjectiveStatusChart;