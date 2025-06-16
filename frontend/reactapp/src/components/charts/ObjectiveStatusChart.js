import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getDefaultDonutOptions } from '../../utils/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

const ObjectiveStatusChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        return {
            // Las etiquetas ya vienen traducidas desde el componente padre
            labels: data.map(item => item.name),
            datasets: [{
                label: t('charts.objectiveStatusLabel'),
                data: data.map(item => item.value),
                // --- CORRECCIÓN: Usar la propiedad 'color' que ya se está pasando ---
                backgroundColor: data.map(item => item.color || 'rgba(201, 203, 207, 0.8)'),
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