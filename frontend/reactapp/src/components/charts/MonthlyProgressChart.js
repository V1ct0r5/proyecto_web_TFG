import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const categoryNameToKeyMap = {
    'Finanzas': 'categories.finance',
    'Salud': 'categories.health',
    'Desarrollo personal': 'categories.personalDevelopment',
    'Relaciones': 'categories.relationships',
    'Carrera profesional': 'categories.career',
    'Otros': 'categories.other'
};

const getLineChartColors = (index) => {
    const colors = [
        { border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.2)' },
        { border: 'rgba(153, 102, 255, 1)', background: 'rgba(153, 102, 255, 0.2)' },
        { border: 'rgba(255, 159, 64, 1)', background: 'rgba(255, 159, 64, 0.2)' }
    ];
    return colors[index % colors.length];
};

const MonthlyProgressChart = ({ data }) => {
    const { t } = useTranslation();

    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }
        const labels = data.map(item => item.month);
        const categories = Object.keys(data[0] || {}).filter(key => key !== 'month');
        const datasets = categories.map((category, index) => {
            const categoryData = data.map(item => item[category] || 0);
            const colors = getLineChartColors(index);
            const translatedLabel = t(categoryNameToKeyMap[category] || category);
            return {
                label: translatedLabel, // Usamos la etiqueta traducida
                data: categoryData,
                borderColor: colors.border, 
                backgroundColor: colors.background,
                fill: false, 
                tension: 0.2, 
                pointRadius: 3, 
                pointHoverRadius: 5,
            };
        });
        return { labels, datasets };
    }, [data]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>{t('charts.noMonthlyProgressData')}</p>;
    }

    const options = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: t('charts.progressAxis') }, ticks: { callback: value => value + '%' } },
            x: { title: { display: true, text: t('charts.monthAxis') } }
        },
        plugins: {
            legend: { position: 'bottom' }, title: { display: false },
            tooltip: {
                mode: 'index', intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) label += context.parsed.y.toFixed(1) + '%';
                        return label;
                    }
                }
            }
        },
        interaction: { mode: 'index', intersect: false },
    };

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', minHeight: '350px' }}>
            <Line data={processedChartData} options={options} />
        </div>
    );
};

export default MonthlyProgressChart;