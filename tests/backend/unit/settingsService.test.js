// ¡IMPORTANTE! Mockear el módulo ANTES de cualquier importación.
jest.mock('@/config/database');

const settingsService = require('@/api/services/settingsService');
const db = require('@/config/database');
const AppError = require('@/utils/AppError');
const { User } = db;

describe('SettingsService', () => {
  const userId = 1;
  const mockUserInstance = {
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    comparePassword: jest.fn().mockResolvedValue(true),
  };
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  };

  beforeEach(() => {
    // clearMocks es automático, pero por si acaso.
    jest.clearAllMocks();
    
    // Configura el mock para que devuelva la instancia de usuario
    User.findByPk.mockResolvedValue(mockUserInstance);
    db.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it('updateUserSettings debería actualizar la configuración', async () => {
    await settingsService.updateUserSettings(userId, { themePreference: 'dark' });
    expect(User.findByPk).toHaveBeenCalledWith(userId);
    expect(mockUserInstance.update).toHaveBeenCalledWith({ themePreference: 'dark' });
  });

  it('changeUserPassword debería cambiar la contraseña', async () => {
    await settingsService.changeUserPassword(userId, 'current', 'new');
    expect(User.findByPk).toHaveBeenCalledWith(userId);
    expect(mockUserInstance.comparePassword).toHaveBeenCalledWith('current');
    expect(mockUserInstance.save).toHaveBeenCalled();
  });
  
  it('deleteUserAccount debería eliminar al usuario', async () => {
    await settingsService.deleteUserAccount(userId);
    expect(User.findByPk).toHaveBeenCalledWith(userId, { transaction: mockTransaction });
    expect(mockUserInstance.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
  
  it('deleteUserAccount debería hacer rollback si la eliminación falla', async () => {
    mockUserInstance.destroy.mockRejectedValue(new Error('DB Error'));
    await expect(settingsService.deleteUserAccount(userId)).rejects.toThrow(AppError);
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});