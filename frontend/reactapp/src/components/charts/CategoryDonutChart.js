// frontend/reactapp/src/components/charts/CategoryDonutChart.js
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getCategoryChartColors } from '../../utils/ChartColors';
import { getDefaultDonutOptions } from '../../utils/chartUtils'; // <-- Importamos la utilidad

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Muestra un gráfico de dona para la distribución de categorías.
 * @param {Array<{name: string, value: number}>} data - Los datos a graficar.
 */
const CategoryDonutChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };

        const labels = data.map(item => item.name); // Ya viene traducido del componente padre
        const values = data.map(item => item.value);
        const { backgroundColors, borderColors } = getCategoryChartColors(data);

        return {
            labels,
            datasets: [{
                label: t('charts.distributionByCategoryLabel'),
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }],
        };
    }, [data, t]);

    const chartOptions = useMemo(() => getDefaultDonutOptions(t), [t]);

    if (!data || data.length === 0) {
        return <p>{t('charts.noCategoryData')}</p>;
    }

    return (
        <div style={{ height: '100%', minHeight: '250px', position: 'relative' }}>
            <Doughnut data={chartData} options={chartOptions} />
        </div>
    );
};

export default CategoryDonutChart;