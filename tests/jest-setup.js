const db = require('@/config/database');

// Se ejecuta UNA VEZ antes de que comiencen todas las pruebas.
beforeAll(async () => {
    // Asegura que la base de datos esté conectada y sincronizada.
    await db.initializeDatabase();
});

// Se ejecuta ANTES DE CADA prueba individual ('it').
beforeEach(async () => {
    // Método de limpieza robusto para bases de datos con claves foráneas.
    const models = Object.values(db.sequelize.models);
    
    // 1. Desactivamos temporalmente las restricciones de clave foránea.
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

    // 2. Limpiamos todas las tablas.
    for (const model of models) {
        // Usamos destroy en lugar de truncate, que es más compatible.
        await model.destroy({ where: {}, force: true });
    }

    // 3. Reactivamos las restricciones de clave foránea.
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
});

// Se ejecuta UNA VEZ después de que todas las pruebas hayan finalizado.
afterAll(async () => {
    // Cierra la conexión a la base de datos para que Jest pueda terminar limpiamente.
    await db.sequelize.close();
});