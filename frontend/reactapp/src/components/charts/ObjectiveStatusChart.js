// frontend/reactapp/src/components/charts/ObjectiveStatusChart.js
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getDefaultDonutOptions } from '../../utils/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

// Colores específicos para los estados
const STATUS_COLORS = {
    IN_PROGRESS: 'rgba(54, 162, 235, 0.8)',
    COMPLETED: 'rgba(75, 192, 192, 0.8)',
    PENDING: 'rgba(255, 206, 86, 0.8)',
    FAILED: 'rgba(255, 99, 132, 0.8)',
    ARCHIVED: 'rgba(153, 102, 255, 0.8)',
};

const ObjectiveStatusChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        return {
            labels: data.map(item => t(`status.${item.name.toLowerCase()}`, item.name)),
            datasets: [{
                label: t('charts.objectiveStatusLabel'),
                data: data.map(item => item.value),
                backgroundColor: data.map(item => STATUS_COLORS[item.name] || 'rgba(201, 203, 207, 0.8)'),
            }],
        };
    }, [data, t]);

    const chartOptions = useMemo(() => getDefaultDonutOptions(t), [t]);

    if (!data || data.length === 0) return <p>{t('charts.noStatusData')}</p>;

    return (
        <div style={{ height: "100%", position: 'relative', minHeight: "250px" }}>
            <Doughnut data={chartData} options={chartOptions} />
        </div>
    );
};

export default ObjectiveStatusChart;