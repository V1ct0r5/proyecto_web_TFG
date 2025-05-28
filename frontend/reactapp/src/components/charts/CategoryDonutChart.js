import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

/**
 * Componente CategoryDonutChart
 * @param {Object} props
 * @param {Array<Object>} props.data - Array de objetos para el gráfico.
 * Cada objeto debe tener: { name: string, value: number, color?: string }
 */
const CategoryDonutChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>No hay datos de categorías para mostrar.</p>;
    }

    // Funciones auxiliares para colores (considerar mover a un archivo de utilidades)
    function getRandomColor() {
        const r = Math.floor(Math.random() * 200); // Evita colores demasiado claros/oscuros
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        return `rgb(${r},${g},${b})`;
    }

    function brightenColor(hex, percent) {
        hex = hex.replace(/^\s*#|\s*$/g, '');
        if (hex.length === 3) {
            hex = hex.replace(/(.)/g, '$1$1');
        }
        let r = parseInt(hex.substring(0, 2), 16),
            g = parseInt(hex.substring(2, 4), 16),
            b = parseInt(hex.substring(4, 6), 16);

        const p = percent / 100;
        r = Math.min(255, Math.max(0, Math.round(r * (1 + p))));
        g = Math.min(255, Math.max(0, Math.round(g * (1 + p))));
        b = Math.min(255, Math.max(0, Math.round(b * (1 + p))));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                label: 'Distribución por Categoría',
                data: data.map(item => item.value),
                backgroundColor: data.map(item => item.color || getRandomColor()),
                borderColor: data.map(item => item.color ? brightenColor(item.color, -20) : brightenColor(getRandomColor(), -20)), // Usar color base o aleatorio para borde
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Importante para controlar el tamaño con el div contenedor
        plugins: {
            legend: {
                position: 'bottom', // Posiciones alternativas: 'right', 'left', 'top'
                labels: {
                    font: { size: 10 },
                    boxWidth: 10,
                    padding: 10,
                }
            },
            title: {
                display: false, // Título desactivado; se asume que el contexto (ej. StatsCard) lo provee
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            // Calcular y mostrar porcentaje en el tooltip
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            label += `${context.raw} (${percentage}%)`;
                        }
                        return label;
                    }
                }
            }
        },
        cutout: '60%', // Define el grosor del anillo para el gráfico de dona
    };

    // Es crucial que el div contenedor del gráfico tenga una altura definida
    // para que Chart.js pueda renderizar correctamente.
    return (
        <div style={{ height: '120px', width: '100%', position: 'relative' }}> {/* Altura de ejemplo, ajustar según necesidad */}
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export default CategoryDonutChart;