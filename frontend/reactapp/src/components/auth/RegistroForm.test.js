// ruta: frontend/reactapp/src/components/auth/RegistroForm.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegistroForm from './RegistroForm';
import { useAuth } from '../../context/AuthContext';

// Mock del contexto de Auth y react-router
jest.mock('../../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));


describe('RegistroForm Component', () => {
    const mockRegister = jest.fn();

    beforeEach(() => {
        useAuth.mockReturnValue({
            register: mockRegister,
            error: null,
            loading: false,
        });
        mockRegister.mockClear();
    });

    it('debería renderizar todos los campos para el registro', () => {
        render(<RegistroForm />, { wrapper: BrowserRouter });
        expect(screen.getByLabelText('register.username')).toBeInTheDocument();
        expect(screen.getByLabelText('register.email')).toBeInTheDocument();
        expect(screen.getByLabelText('register.password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'register.register_button' })).toBeInTheDocument();
    });

    it('debería llamar a la función register al enviar el formulario con datos válidos', async () => {
        render(<RegistroForm />, { wrapper: BrowserRouter });

        await userEvent.type(screen.getByLabelText('register.username'), 'nuevoUsuario');
        await userEvent.type(screen.getByLabelText('register.email'), 'nuevo@test.com');
        await userEvent.type(screen.getByLabelText('register.password'), 'password123');
        await userEvent.click(screen.getByRole('button', { name: 'register.register_button' }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledTimes(1);
            expect(mockRegister).toHaveBeenCalledWith({
                username: 'nuevoUsuario',
                email: 'nuevo@test.com',
                password: 'password123',
            });
        });
    });
});
