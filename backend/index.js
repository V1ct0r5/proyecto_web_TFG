const app = require('./app');  // Importamos la instancia configurada de la app
const db = require('./src/config/database'); // Importar la configuración de la base de datos
const path = require('path');
// Asegurarse de que las variables de entorno se cargan ANTES de usar process.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Definir el puerto usando la variable de entorno o un valor por defecto
const PORT = process.env.PORT || 3000;

async function main() {
    try {
        // Inicializar la base de datos y esperar a que termine (conexión, sync)
        await db.initializeDatabase();
        console.log('Base de datos y modelos inicializados.'); // Log después de inicializar

        // Iniciar el servidor Express después de que la DB esté lista
        app.listen(PORT, () => {
            console.log(`Servidor backend corriendo en el puerto ${PORT}`); // Log más claro
        });

    } catch (error) {
        // Manejar errores críticos de inicialización (ej. conexión a DB fallida)
        console.error('Error crítico al iniciar la aplicación:', error);
        process.exit(1); // Salir del proceso con un código de error
    }
}

// Ejecutar la función principal
main();

// No necesitas exportar 'app' desde index.js a menos que otro archivo lo necesite (raro)
// module.exports = app;