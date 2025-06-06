import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const getCssVariableValue = (variableName) => {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return value || null;
  }
  return null;
};

const DistributionBarChart = ({ completedPercentage, remainingPercentage }) => {
  const { t } = useTranslation();
  const [chartStyling, setChartStyling] = useState({
    completedBg: 'rgba(79, 70, 229, 0.7)',
    completedBorder: '#4F46E5',
    remainingBg: 'rgba(100, 116, 139, 0.6)',
    remainingBorder: '#64748B',
  });

  useEffect(() => {
    const completedBgColor = getCssVariableValue('--chart-bar-completed-bg') || chartStyling.completedBg;
    const completedBorderColor = getCssVariableValue('--chart-bar-completed-border') || chartStyling.completedBorder;
    const remainingBgColor = getCssVariableValue('--chart-bar-remaining-bg') || chartStyling.remainingBg;
    const remainingBorderColor = getCssVariableValue('--chart-bar-remaining-border') || chartStyling.remainingBorder;

    setChartStyling({
      completedBg: completedBgColor,
      completedBorder: completedBorderColor,
      remainingBg: remainingBgColor,
      remainingBorder: remainingBorderColor,
    });
  }, []);

  const chartData = useMemo(() => ({
    labels: [t('charts.completed'), t('charts.remaining')],
    datasets: [
      {
        label: t('charts.percentage'),
        data: [completedPercentage, remainingPercentage],
        backgroundColor: [
          chartStyling.completedBg,
          chartStyling.remainingBg,
        ],
        borderColor: [
          chartStyling.completedBorder,
          chartStyling.remainingBorder,
        ],
        borderWidth: 1,
      },
    ],
  }), [completedPercentage, remainingPercentage, chartStyling, t]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
            display: true,
            text: t('charts.status')
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
            display: true,
            text: t('charts.percentageAxis')
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let tooltipLabel = context.label || '';
            if (tooltipLabel) {
              tooltipLabel += ': ';
            }
            if (context.parsed.y !== null) {
              tooltipLabel += context.parsed.y.toFixed(1) + '%';
            }
            return tooltipLabel;
          },
        },
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default DistributionBarChart;