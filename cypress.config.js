const { defineConfig } = require('cypress');
const db = require('./backend/src/config/database'); // Importa tu instancia de la base de datos

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // --- AÑADE ESTA TAREA ---
      on('task', {
        async resetTestDatabase() {
          try {
            // Sincroniza la base de datos, forzando la recreación de las tablas
            await db.sync({ force: true });
            return null; // Cypress requiere que las tareas devuelvan algo o null
          } catch (error) {
            console.error('Failed to reset test database:', error);
            throw error; // Lanza el error para que el test falle si la BD no se puede resetear
          }
        }
      });
      // --- FIN DE LA TAREA ---
    },
  },
});