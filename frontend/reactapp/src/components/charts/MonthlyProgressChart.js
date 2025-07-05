import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, Title } from 'chart.js';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, Title);

const MonthlyProgressChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        return data || { labels: [], datasets: [] };
    }, [data]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: t('charts.progressAxis') }, 
                ticks: { callback: value => value + '%' }
            },
            x: { 
                title: { display: true, text: t('charts.monthAxis') },
                grid: {
                    display: false,
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(1) || 0}%`,
                }
            },
            title: {
                display: false,
            }
        }
    }), [t]);

    if (!data?.datasets || data.datasets.length === 0) {
        return <p>{t('charts.noMonthlyProgressData')}</p>;
    }

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
};

MonthlyProgressChart.propTypes = {
    data: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        datasets: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string.isRequired,
            data: PropTypes.arrayOf(PropTypes.number).isRequired,
            borderColor: PropTypes.string,
            backgroundColor: PropTypes.string,
        }))
    })
};

export default MonthlyProgressChart;