const app = require('./app');
const db = require('./src/config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await db.initializeDatabase();
        console.log('Base de datos y modelos inicializados.');

        app.listen(PORT, () => {
            console.log(`Servidor backend corriendo en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error crítico al iniciar la aplicación:', error);
        process.exit(1);
    }
}

main();