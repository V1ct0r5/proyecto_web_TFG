import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const DistributionBarChart = ({ progressMade, progressRemaining, totalJourney, unit = '' }) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => ({
    labels: [t('charts.progressMade'), t('charts.progressRemaining')],
    datasets: [
      {
        label: `${t('charts.valueIn')} ${unit}`,
        data: [progressMade, progressRemaining], 
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(201, 203, 207, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(201, 203, 207, 1)',
        ],
        borderWidth: 1,
        barPercentage: 1,
      },
    ],
  }), [progressMade, progressRemaining, unit, t]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: totalJourney > 0 ? totalJourney * 1.1 : undefined,
        ticks: { 
          callback: (value) => `${value.toLocaleString()} ${unit}` 
        },
      },
      x: { 
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.y?.toLocaleString() || 0} ${unit}`,
        },
      },
    },
  }), [totalJourney, unit, t]);

  return <Bar options={chartOptions} data={chartData} />;
};

export default DistributionBarChart;