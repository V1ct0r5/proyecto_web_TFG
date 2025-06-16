// ruta: frontend/reactapp/src/components/charts/ObjectiveStatusChart.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import ObjectiveStatusChart from './ObjectiveStatusChart';

// Recharts necesita un mock para funcionar en el entorno de Jest
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }) => (
            <div className="responsive-container" style={{ width: 800, height: 800 }}>
                {children}
            </div>
        ),
    };
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('ObjectiveStatusChart Component', () => {
    const mockData = [
        { name: 'Completados', value: 10 },
        { name: 'En Progreso', value: 5 },
        { name: 'Pendientes', value: 2 },
    ];

    it('debería renderizar el gráfico con los datos proporcionados', () => {
        render(<ObjectiveStatusChart data={mockData} />);
        
        // Verificamos que se renderizan las leyendas de los datos
        expect(screen.getByText('Completados')).toBeInTheDocument();
        expect(screen.getByText('En Progreso')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        
        // Verificamos que los valores numéricos están presentes
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('debería mostrar un mensaje cuando no hay datos', () => {
        render(<ObjectiveStatusChart data={[]} />);
        expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    });
});
