// ruta: frontend/reactapp/src/components/objetivos/ObjetivoCard.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ObjetivoCard from './ObjetivoCard';

// Mock de i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('ObjetivoCard Component', () => {
    const mockObjective = {
        id: 1,
        title: 'Aprender a Testear',
        description: 'Escribir tests para mi app',
        category: 'Desarrollo',
        objective_type: 'numerico',
        current_value: 5,
        target_value: 10,
    };

    it('debería renderizar la información del objetivo correctamente', () => {
        render(
            <BrowserRouter>
                <ObjetivoCard objetivo={mockObjective} onDelete={() => {}} />
            </BrowserRouter>
        );

        expect(screen.getByText('Aprender a Testear')).toBeInTheDocument();
        expect(screen.getByText('Escribir tests para mi app')).toBeInTheDocument();
        expect(screen.getByText('objetivos.category_label: Desarrollo')).toBeInTheDocument();
        // Verificar que la barra de progreso existe (se asume que es un role 'progressbar')
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('debería mostrar "Completado" para un objetivo booleano completado', () => {
        const booleanObjective = {
            ...mockObjective,
            objective_type: 'booleano',
            current_value: 1,
            target_value: 1,
        };

        render(
            <BrowserRouter>
                <ObjetivoCard objetivo={booleanObjective} onDelete={() => {}} />
            </BrowserRouter>
        );
        
        expect(screen.getByText('Completado')).toBeInTheDocument();
    });
});
