// cypress.config.js

const { defineConfig } = require('cypress');
const db = require('./backend/src/config/database'); // Asegúrate que la ruta es correcta

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      on('task', {
        // Tarea para resetear un usuario específico (la que ya tienes)
        async resetTestUser(email) {
          if (!email) return null;
          try {
            const { User } = db;
            await User.destroy({ where: { email } });
            return null;
          } catch (e) {
            console.error('Error reseteando el usuario:', e.message);
            return null;
          }
        },

        // --- TAREA NUEVA Y RECOMENDADA ---
        // Borra TODOS los datos de las tablas para un inicio 100% limpio.
        async cleanDatabase() {
          try {
            // Borramos en orden inverso a la creación para respetar las claves foráneas
            await db.Progress.destroy({ truncate: true, cascade: true });
            await db.ActivityLog.destroy({ truncate: true, cascade: true });
            await db.Objective.destroy({ truncate: true, cascade: true });
            await db.User.destroy({ truncate: true, cascade: true });
            return null;
          } catch(e) {
            console.error('Error limpiando la base de datos:', e.message);
            return null;
          }
        }
      });
    },
  },
});