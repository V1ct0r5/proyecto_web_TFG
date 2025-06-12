// frontend/reactapp/src/components/charts/DistributionBarChart.js
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const DistributionBarChart = ({ completedPercentage, remainingPercentage }) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => ({
    labels: [t('charts.completed'), t('charts.remaining')],
    datasets: [
      {
        label: t('charts.percentage'),
        data: [completedPercentage, remainingPercentage],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)', // Color para "Completado" (var --success)
          'rgba(201, 203, 207, 0.6)', // Color para "Restante" (var --muted)
        ],
        barThickness: 50,
      },
    ],
  }), [completedPercentage, remainingPercentage, t]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value) => value + '%' },
      },
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.y?.toFixed(1) || 0}%`,
        },
      },
    },
  }), [t]);

  return <Bar options={chartOptions} data={chartData} />;
};

export default DistributionBarChart;