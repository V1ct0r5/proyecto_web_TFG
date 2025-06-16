'use strict'; // Importante para que Jest trate el archivo como un módulo

const db = {
  sequelize: {
    transaction: jest.fn(() => Promise.resolve({
      commit: jest.fn(() => Promise.resolve()),
      rollback: jest.fn(() => Promise.resolve()),
    })),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Objective: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Progress: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  ActivityLog: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
};

module.exports = db;