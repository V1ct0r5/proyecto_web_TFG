// frontend/reactapp/src/components/charts/ProgressLineChart.js
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, annotationPlugin);

const ProgressLineChart = ({ progressHistory, unitMeasure, targetValue, isLowerBetter }) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    const chartDataAndOptions = useMemo(() => {
        if (!progressHistory || progressHistory.length < 2) return null;

        const sortedHistory = [...progressHistory].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));
        
        const data = {
            labels: sortedHistory.map(item => format(parseISO(item.entryDate), 'd MMM', { locale: dateLocale })),
            datasets: [{
                label: t('charts.progressLabelWithUnit', { unit: unitMeasure || '' }),
                data: sortedHistory.map(item => item.value),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.3,
            }],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: unitMeasure || 'Valor' } },
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        targetLine: {
                            type: 'line',
                            yMin: targetValue,
                            yMax: targetValue,
                            borderColor: 'rgb(245, 158, 11)',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                content: t('common.target'),
                                enabled: true,
                                position: 'end',
                            },
                        },
                    },
                },
            },
        };

        return { data, options };

    }, [progressHistory, unitMeasure, targetValue, isLowerBetter, t, dateLocale]);
    
    if (!chartDataAndOptions) {
        return <p>{t('charts.notEnoughDataForChart')}</p>;
    }

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <Line data={chartDataAndOptions.data} options={chartDataAndOptions.options} />
        </div>
    );
};

export default ProgressLineChart;