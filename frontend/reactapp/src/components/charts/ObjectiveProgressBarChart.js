// frontend/reactapp/src/components/charts/ObjectiveProgressBarChart.js
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getDefaultHorizontalBarOptions } from '../../utils/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BAR_HEIGHT_PX = 35;
const MIN_CHART_HEIGHT_PX = 200;

const ObjectiveProgressBarChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        return {
            labels: data.map(item => item.name),
            datasets: [{
                label: t('charts.objectiveProgressLabel'),
                data: data.map(item => item.progressPercentage),
                backgroundColor: 'rgba(79, 70, 229, 0.7)', // var(--primary)
            }],
        };
    }, [data, t]);

    const chartOptions = useMemo(() => getDefaultHorizontalBarOptions(t, t('charts.progressAxis')), [t]);
    
    if (!data || data.length === 0) return <p>{t('charts.noObjectiveProgressData')}</p>;
    
    const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, (data?.length || 0) * BAR_HEIGHT_PX);

    return (
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
};

export default ObjectiveProgressBarChart;