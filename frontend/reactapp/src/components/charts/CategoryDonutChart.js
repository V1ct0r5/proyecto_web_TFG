import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { getCategoryChartColors } from '../../utils/ChartColors';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const CategoryDonutChart = ({ data }) => {
    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Distribución por Categoría',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1,
                    offset: 8,
                }],
            };
        }

        const labels = data.map(item => item.name);
        const chartValues = data.map(item => item.value);
        const { backgroundColors, borderColors } = getCategoryChartColors(data);

        return {
            labels,
            datasets: [
                {
                    label: 'Distribución por Categoría',
                    data: chartValues,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    offset: 8,
                },
            ],
        };
    }, [data]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>No hay datos de categorías para mostrar.</p>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { size: 10 },
                    boxWidth: 10,
                    padding: 10,
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null && context.dataset.data.length > 0) {
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            label += `${context.raw} (${percentage}%)`;
                        } else if (context.raw !== undefined) {
                            label += context.raw;
                        }
                        return label;
                    }
                }
            }
        },
        cutout: '60%',
    };

    return (
        <div style={{ height: '120px', width: '100%', position: 'relative' }}>
            <Doughnut data={processedChartData} options={options} />
        </div>
    );
};

export default CategoryDonutChart;