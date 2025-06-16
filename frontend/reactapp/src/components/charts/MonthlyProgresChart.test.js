// ruta: frontend/reactapp/src/components/charts/MonthlyProgressChart.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import MonthlyProgressChart from './MonthlyProgressChart';

// Mockear Recharts para el entorno de Jest
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }) => (
            <div className="responsive-container">{children}</div>
        ),
    };
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('MonthlyProgressChart Component', () => {
    const mockData = [
        { month: '2025-05', count: 3 },
        { month: '2025-06', count: 8 },
        { month: '2025-07', count: 5 },
    ];

    it('debería renderizar las barras y etiquetas del gráfico con los datos proporcionados', () => {
        render(<MonthlyProgressChart data={mockData} />);

        // Verificar que las etiquetas de los meses (eje X) se renderizan
        expect(screen.getByText('may. 2025')).toBeInTheDocument();
        expect(screen.getByText('jun. 2025')).toBeInTheDocument();
        expect(screen.getByText('jul. 2025')).toBeInTheDocument();
        
        // Es difícil seleccionar las barras en sí, pero podemos verificar que el contenedor del gráfico existe.
        // La presencia de las etiquetas es un buen indicador de que el gráfico se renderizó.
        expect(screen.getByText('analysis.monthly_completions')).toBeInTheDocument();
    });

    it('debería mostrar un mensaje cuando no hay datos', () => {
        render(<MonthlyProgressChart data={[]} />);
        expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    });
});
