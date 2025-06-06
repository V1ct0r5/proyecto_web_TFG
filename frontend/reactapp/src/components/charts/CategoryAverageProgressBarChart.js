import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ESTIMATED_BAR_HEIGHT_PX = 35;
const MIN_CHART_HEIGHT_PX = 200;

const CategoryAverageProgressBarChart = ({ data }) => {
    const { t } = useTranslation();

    const processedChartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item.categoryName);
        const progressValues = data.map(item => item.averageProgress);
        const backgroundColors = data.map(item => item.color || 'rgba(79, 70, 229, 0.7)');
        const borderColors = data.map(item => (item.color ? item.color.split(',')[0].replace('rgba', 'rgb') + ')' : '#4F46E5'));

        return {
            labels,
            datasets: [{
                label: t('charts.averageProgressLabel'),
                data: progressValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }],
        };
    }, [data, t]);

    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>{t('charts.noAverageCategoryProgressData')}</p>;
    }

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { beginAtZero: true, max: 100, title: { display: true, text: t('charts.averageProgressAxis') }, ticks: { callback: value => value + '%' } },
            y: { ticks: { autoSkip: false } }
        },
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: { callbacks: { label: context => `${context.dataset.label || ''}: ${context.parsed.x ? context.parsed.x.toFixed(1) : 0}%` } }
        },
    };

    const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, (data?.length || 0) * ESTIMATED_BAR_HEIGHT_PX);

    return (
        <div style={{ height: '100%', minHeight: `${chartHeight}px`, width: '100%', position: 'relative' }}>
            <Bar data={processedChartData} options={options} />
        </div>
    );
};

export default CategoryAverageProgressBarChart;