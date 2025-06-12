// frontend/reactapp/src/components/charts/MonthlyProgressChart.js
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, Title } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, Title);

const MonthlyProgressChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item.monthYear);

        const datasets = [{
            // CONFIGURADO: Usando la clave del fichero JSON para la leyenda del gráfico.
            label: t('charts.averageProgressLabel'), 
            data: data.map(item => item.averageProgress),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.3,
        }];

        return { labels, datasets };
    }, [data, t]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                // CONFIGURADO: Usando la clave del fichero JSON para el título del eje Y.
                title: { display: true, text: t('charts.progressAxis') }, 
                ticks: { callback: value => value + '%' }
            },
            x: { 
                // CONFIGURADO: Usando la clave del fichero JSON para el título del eje X.
                title: { display: true, text: t('charts.monthAxis') } 
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(1) || 0}%`,
                }
            }
        }
    }), [t]);

    // CONFIGURADO: Usando la clave del fichero JSON para el mensaje de "no hay datos".
    if (!data || data.length === 0) {
        return <p>{t('charts.noMonthlyProgressData')}</p>;
    }

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
};

export default MonthlyProgressChart;