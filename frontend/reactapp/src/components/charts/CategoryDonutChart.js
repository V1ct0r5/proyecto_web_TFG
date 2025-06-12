// frontend/reactapp/src/components/charts/CategoryDonutChart.js
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getCategoryChartColors } from '../../utils/ChartColors';
import { getDefaultDonutOptions } from '../../utils/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Muestra un gráfico de dona para la distribución de categorías.
 * @param {Array<{name: string, value: number}>} data - Los datos a graficar.
 */
const CategoryDonutChart = ({ data }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }
        const labels = data.map(item => item.name);
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

    // Las opciones se obtienen de chartUtils.js, que ya incluye maintainAspectRatio: false
    const chartOptions = useMemo(() => getDefaultDonutOptions(t), [t]);

    if (!data || data.length === 0) {
        return <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{t('charts.noCategoryData')}</p>;
    }
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Doughnut data={chartData} options={chartOptions} />
        </div>
    );
    // <-- FIN DE LA CORRECCIÓN FINAL -->
    // ==================================================================
};

export default CategoryDonutChart;