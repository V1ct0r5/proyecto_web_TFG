const objectivesService = require('../../../backend/src/api/services/objectivesService');
const Objetivo = require('../../../backend/src/api/models/objectives');
const { expect } = require('chai');

jest.mock('../../../backend/src/api/models/objectives');

describe('Objetivos Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const objetivoDataValida = {
        nombre: 'Leer 10 libros',
        descripcion: 'Leer 10 libros de ficción este año',
        tipo_objetivo: 'Desarrollo personal',
        valor_cuantitativo: 10,
        unidad_medida: 'libros',
        fecha_inicio: new Date(),
        fecha_fin: '2025-12-31',
        estado: 'Pendiente',
    };

    const objetivoExistente = {
        id_objetivo: 1,
        ...objetivoDataValida,
    };

    describe('obtenerObjetivos', () => {
        it('debería devolver una lista de objetivos', async () => {
            const objetivosMock = [objetivoExistente, { id_objetivo: 2, ...objetivoDataValida }];
            Objetivo.findAll.mockResolvedValue(objetivosMock);

            const resultado = await objectivesService.obtenerObjetivos();

            expect(Objetivo.findAll).toHaveBeenCalled();
            expect(resultado).toEqual(objetivosMock);
        
        });

        it('debería lanzar un error si ocurre un problema al obtener los objetivos', async () => {
            Objetivo.findAll.mockRejectedValue(new Error('Error de base de datos'));

            await expect(objectivesService.obtenerObjetivos()).rejects.toThrow('Error al obtener los objetivos: Error de base de datos');
        });
    });

    describe('obtenerObjetivoPorId', () => {
        it('debería devolver un objetivo específico por un ID existente', async () => {
            Objetivo.findByPk.mockResolvedValue(objetivoExistente);

            const resultado = await objectivesService.obtenerObjetivoPorId(objetivoExistente.id_objetivo);

            expect(Objetivo.findByPk).toHaveBeenCalledWith(objetivoExistente.id_objetivo);
            expect(resultado).toEqual(objetivoExistente);
        });

        it('debería devolver null si el objetivo no existe', async () => {
            Objetivo.findByPk.mockResolvedValue(null);

            const resultado = await objectivesService.obtenerObjetivoPorId(999); // ID que no existe
            expect(Objetivo.findByPk).toHaveBeenCalledWith(999);
            expect(resultado).toBeNull();
        });

        it('debería lanzar un error si ocurre un problema al obtener el objetivo', async () => {
            Objetivo.findByPk.mockRejectedValue(new Error('Error de base de datos'));

            await expect(objectivesService.obtenerObjetivoPorId(objetivoExistente.id_objetivo)).rejects.toThrow('Error al obtener el objetivo: Error de base de datos');
        });
    });

    describe('crearObjetivo', () => {
        it('debería crear un nuevo objetivo y devolverlo', async () => {
            Objetivo.create.mockResolvedValue(objetivoExistente);

            const resultado = await objectivesService.crearObjetivo(objetivoDataValida);

            expect(Objetivo.create).toHaveBeenCalledWith(objetivoDataValida);
            expect(resultado).toEqual(objetivoExistente);
        });

        it('debería lanzar un error si ocurre un problema al crear el objetivo', async () => {
            Objetivo.create.mockRejectedValue(new Error('Error de base de datos'));

            await expect(objectivesService.crearObjetivo(objetivoDataValida)).rejects.toThrow('Error al crear el objetivo: Error de base de datos');
        });
    });

    describe('actualizarObjetivo', () => {
        it('debería actualizar un objetivo existente y devolverlo', async () => {
            const objetivoActualizadoData = { ...objetivoDataValida, nombre: 'Leer 20 libros' };
            const objetivoActualizado = { ...objetivoExistente, ...objetivoActualizadoData };

            Objetivo.findByPk.mockResolvedValue(objetivoExistente);
            Objetivo.update.mockResolvedValue([1]); // Simulamos que se actualizó 1 fila
            Objetivo.findByPk.mockResolvedValue(objetivoActualizado);

            const resultado = await objectivesService.actualizarObjetivo(objetivoExistente.id_objetivo, objetivoActualizadoData);

            expect(Objetivo.findByPk).toHaveBeenCalledWith(objetivoExistente.id_objetivo);
            expect(Objetivo.update).toHaveBeenCalledWith(objetivoActualizadoData, { where: { id_objetivo: objetivoExistente.id_objetivo } });
            expect(Objetivo.findByPk).toHaveBeenCalledWith(objetivoExistente.id_objetivo);
            expect(resultado).toEqual(objetivoActualizado);
        });

        it('debería dar null si el objetivo no existe', async () => {
            Objetivo.findByPk.mockResolvedValue(null);

            const resultado = await objectivesService.actualizarObjetivo(999, {nombre: 'Nuevo nombre'}); // ID que no existe

            expect(Objetivo.findByPk).toHaveBeenCalledWith(999);
            expect(Objetivo.update).not.toHaveBeenCalled();
            expect(resultado).toBeNull();
        });

        it('debería lanzar un error si ocurre un problema al actualizar el objetivo', async () => {
            Objetivo.findByPk.mockResolvedValue(objetivoExistente);
            Objetivo.update.mockRejectedValue(new Error('Error de base de datos'));

            await expect(objectivesService.actualizarObjetivo(objetivoExistente.id_objetivo, {nombre: 'Nuevo nombre'})).rejects.toThrow('Error al actualizar el objetivo: Error de base de datos');
        });
    });

    describe('eliminarObjetivo', () => {
        it('debería eliminar un objetivo existente y devolver true', async () => {
            Objetivo.destroy.mockResolvedValue(1); // Simulamos que se eliminó 1 fila

            await objectivesService.eliminarObjetivo(objetivoExistente.id_objetivo);

            expect(Objetivo.destroy).toHaveBeenCalledWith({ where: { id_objetivo: objetivoExistente.id_objetivo } });
        });

        it('debería no hacer nada si el objetivo no existe', async () => {
            Objetivo.destroy.mockResolvedValue(0); // Simulamos que no se eliminó nada

            await objectivesService.eliminarObjetivo(999); // ID que no existe

            expect(Objetivo.destroy).toHaveBeenCalledWith({ where: { id_objetivo: 999 } });
        });

        it('debería lanzar un error si ocurre un problema al eliminar el objetivo', async () => {
            Objetivo.destroy.mockRejectedValue(new Error('Error de base de datos'));

            await expect(objectivesService.eliminarObjetivo(objetivoExistente.id_objetivo)).rejects.toThrow('Error al eliminar el objetivo: Error de base de datos');
        });
    });
});