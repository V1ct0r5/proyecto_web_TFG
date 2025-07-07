// frontend/reactapp/src/components/charts/CategoryAverageProgressBarChart.js
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getDefaultHorizontalBarOptions } from '../../utils/chartUtils';
import PropTypes from 'prop-types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const BAR_HEIGHT_PX = 35;
const MIN_CHART_HEIGHT_PX = 200;

const CategoryAverageProgressBarChart = ({ data }) => {
    const { t } = useTranslation();

    CategoryAverageProgressBarChart.propTypes = {
        data: PropTypes.arrayOf(PropTypes.shape({
            categoryName: PropTypes.string.isRequired,
            averageProgress: PropTypes.number.isRequired,
            color: PropTypes.string,
        })).isRequired,
    };

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        return {
            labels: data.map(item => item.categoryName),
            datasets: [{
                label: t('charts.averageProgressLabel'),
                data: data.map(item => item.averageProgress),
                backgroundColor: data.map(item => item.color || 'rgba(79, 70, 229, 0.7)'),
            }],
        };
    }, [data, t]);

    const chartOptions = useMemo(() => {
        const options = getDefaultHorizontalBarOptions(t, t('charts.averageProgressAxis'));
        options.scales.x.min = 0;
        options.scales.x.max = 100;
        return options;
    }, [t]);

    if (!data || data.length === 0) {
        return <p>{t('charts.noAverageCategoryProgressData')}</p>;
    }
    
    const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, (data?.length || 0) * BAR_HEIGHT_PX);

    return (
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
};

export default CategoryAverageProgressBarChart;