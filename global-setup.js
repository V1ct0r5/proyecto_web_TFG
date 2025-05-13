// global-setup.js
const db = require('./backend/src/config/database'); // Ruta a tu archivo database.js desde la raíz del proyecto

module.exports = async () => {
  console.log('[Global Setup] Running global setup...'); // Este log ahora debería aparecer
  try {
    // Llama a la función de inicialización de la base de datos para conectar y cargar modelos
    await db.initializeDatabase();
    console.log('[Global Setup] Database initialized (connected and models loaded).');

    // Ejecuta la sincronización explícitamente para crear/recrear las tablas en el entorno de test
    if (db.sequelize) {
        console.log('[Global Setup] Sincronizando base de datos de prueba (force: true)...');
        await db.sequelize.sync({ force: true }); // <-- ¡Aquí se crean las tablas!
        console.log('[Global Setup] Base de datos de prueba sincronizada.');

        // Pasa la instancia de sequelize al scope global para que globalTeardown la pueda cerrar
        global.__SEQUELIZE__ = db.sequelize;
        console.log('[Global Setup] Sequelize instance attached to global for teardown.');
    } else {
         console.error('[Global Setup] Error: db.sequelize is not set after initializeDatabase in global setup.');
         throw new Error("Sequelize instance not found after database initialization.");
    }

  } catch (error) {
    console.error('[Global Setup] Database setup failed:', error);
    // Si la configuración de la base de datos falla, no podemos ejecutar tests. Salimos.
    process.exit(1);
  }
};