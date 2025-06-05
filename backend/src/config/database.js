// backend/src/config/database.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const env = process.env.NODE_ENV || 'development';

let envPath;
if (env === 'test') {
    envPath = path.resolve(__dirname, '../../../.env.test');
} else {
    envPath = path.resolve(__dirname, '../../.env');
}
dotenv.config({ path: envPath });

const dbName = process.env.NODE_ENV === 'test' ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const dbUser = process.env.NODE_ENV === 'test' ? process.env.DB_USER_TEST : process.env.DB_USER;
const dbPassword = process.env.NODE_ENV === 'test' ? process.env.DB_PASSWORD_TEST : process.env.DB_PASSWORD;
const dbHost = process.env.NODE_ENV === 'test' ? process.env.DB_HOST_TEST : process.env.DB_HOST;
const dbDialect = process.env.NODE_ENV === 'test' ? process.env.DB_DIALECT_TEST : process.env.DB_DIALECT;
const dbPort = process.env.NODE_ENV === 'test' ? process.env.DB_PORT_TEST : process.env.DB_PORT;

if (!dbName || !dbUser || !dbPassword || !dbHost || !dbDialect || !dbPort) {
    console.error(`[DB] ERROR: Faltan variables de entorno de base de datos para el entorno "${env}".`);
    console.error(`[DB] Revise su archivo ${envPath}.`);
    process.exit(1);
}

const dbPortInt = parseInt(dbPort, 10);
if (isNaN(dbPortInt)) {
    console.error(`[DB] ERROR: La variable DB_PORT${env === 'test' ? '_TEST' : ''} "${dbPort}" no es un número válido.`);
    process.exit(1);
}

const db = {};

const sequelizeInstance = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
        host: dbHost,
        port: dbPortInt,
        dialect: dbDialect,
        dialectOptions: {
            charset: 'utf8mb4',
        },
        logging: env === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// --- Importar todos los modelos ---
require('../api/models/user')(sequelizeInstance);
require('../api/models/objectives')(sequelizeInstance);
require('../api/models/progress')(sequelizeInstance);
require('../api/models/activityLog')(sequelizeInstance);

db.sequelize = sequelizeInstance;
db.Sequelize = Sequelize;

// --- Asignar modelos al objeto db usando los nombres con los que fueron definidos ---
db.Usuario = sequelizeInstance.models.Usuario;
db.Objetivo = sequelizeInstance.models.Objetivo;
db.Progress = sequelizeInstance.models.Progress;
db.ActivityLog = sequelizeInstance.models.ActivityLog;

// --- Ejecutar asociaciones ---
Object.keys(sequelizeInstance.models).forEach(modelName => {
    if (sequelizeInstance.models[modelName].associate) {
        sequelizeInstance.models[modelName].associate(sequelizeInstance.models);
    }
});

let isInitialized = false;

async function initializeDatabase() {
    if (isInitialized) {
        console.log('[DB] La base de datos ya está inicializada.');
        return db.sequelize;
    }
    try {
        console.log(`[DB] Autenticando con la base de datos '${dbName}'...`);
        await db.sequelize.authenticate();
        console.log(`[DB] Conexión a '${dbName}' establecida con éxito.`);

        const forceSync = process.env.DB_FORCE_SYNC === 'true' || false;
        // `alterSync` será true si DB_ALTER_SYNC es 'true', O si estamos en desarrollo y forceSync es false.
        const alterSync = (process.env.DB_ALTER_SYNC === 'true') || (env === 'development' && !forceSync);

        if (forceSync) {
            console.warn('[DB] Sincronizando base de datos con { force: true } - ¡SE PERDERÁN TODOS LOS DATOS!');
            await db.sequelize.sync({ force: true });
            console.log('[DB] Base de datos sincronizada con force: true.');
        } else if (alterSync) {
            console.log('[DB] Sincronizando base de datos con { alter: true }...');
            await db.sequelize.sync({ alter: true }); // <--- LÍNEA REACTIVADA
            console.log('[DB] Base de datos sincronizada con alter: true.');
        } else {
            console.log('[DB] Sincronizando base de datos (sync estándar)...');
            await db.sequelize.sync();
            console.log('[DB] Base de datos sincronizada.');
        }

        if (forceSync) { // La creación del usuario de prueba solo si se forzó la sincronización
            const existingUser = await db.Usuario.findOne({ where: { correo_electronico: 'test@example.com' } });
            if (!existingUser) {
                const testUserPassword = process.env.DB_PASSWORD_TEST_USER;
                const hashedPassword = await bcrypt.hash(testUserPassword, 10);
                await db.Usuario.create({
                    nombre_usuario: 'usuario_prueba',
                    correo_electronico: 'test@example.com',
                    contrasena: hashedPassword
                });
                console.log('[DB] Usuario de prueba creado.');
            }
        }

        isInitialized = true;
        console.log('[DB] Inicialización de base de datos completada.');
        return db.sequelize;

    } catch (error) {
        console.error(`[DB] Error de conexión/sincronización con la base de datos '${dbName}':`, error);
        // En un escenario real, podrías querer reintentar o manejar esto de forma más elegante
        // en lugar de simplemente lanzar el error y potencialmente detener la aplicación.
        throw error; // Relanzar el error para que la lógica de arranque principal lo maneje
    }
}

db.initializeDatabase = initializeDatabase;

module.exports = db;