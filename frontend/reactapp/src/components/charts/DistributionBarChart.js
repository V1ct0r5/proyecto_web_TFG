// src/components/charts/DistributionBarChart.js
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Función auxiliar para obtener el valor de una variable CSS
const getCssVariableValue = (variableName) => {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return value || null; // Retorna null si la variable está vacía o no se encuentra
  }
  return null;
};

const DistributionBarChart = ({ completedPercentage, remainingPercentage }) => {
  const [chartStyling, setChartStyling] = useState({
    // Fallbacks en caso de que las variables CSS no se carguen
    completedBg: 'rgba(79, 70, 229, 0.7)',     // Fallback --primary con alpha
    completedBorder: '#4F46E5',                 // Fallback --primary sólido
    remainingBg: 'rgba(100, 116, 139, 0.6)',   // Fallback --muted-foreground con alpha
    remainingBorder: '#64748B',                // Fallback --muted-foreground sólido
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
  }, []); // El array vacío asegura que esto se ejecute solo una vez, al montar

  const chartData = useMemo(() => ({
    labels: ['Completado', 'Restante'],
    datasets: [
      {
        label: 'Porcentaje', // Puedes ocultar la leyenda si prefieres
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
  }), [completedPercentage, remainingPercentage, chartStyling]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
            display: true,
            text: 'Estado'
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
            display: true,
            text: 'Porcentaje (%)'
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
        display: true, // O cámbialo a false si no quieres la leyenda arriba
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