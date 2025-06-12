// backend/src/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';

// Determina la ruta del archivo .env según el entorno
const envPath = env === 'test' 
    ? path.resolve(__dirname, '../../../.env.test') 
    : path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

// Carga las variables de entorno específicas del entorno actual
const dbConfig = {
    name: process.env.NODE_ENV === 'test' ? process.env.DB_NAME_TEST : process.env.DB_NAME,
    user: process.env.NODE_ENV === 'test' ? process.env.DB_USER_TEST : process.env.DB_USER,
    password: process.env.NODE_ENV === 'test' ? process.env.DB_PASSWORD_TEST : process.env.DB_PASSWORD,
    host: process.env.NODE_ENV === 'test' ? process.env.DB_HOST_TEST : process.env.DB_HOST,
    dialect: process.env.NODE_ENV === 'test' ? process.env.DB_DIALECT_TEST : process.env.DB_DIALECT,
    port: process.env.NODE_ENV === 'test' ? process.env.DB_PORT_TEST : process.env.DB_PORT,
};

// Valida que todas las variables de configuración necesarias estén presentes
if (Object.values(dbConfig).some(value => value === undefined)) {
    console.error(`[DB] ERROR: Faltan variables de entorno para la base de datos en el entorno "${env}".`);
    console.error(`[DB] Asegúrese de que el archivo ${envPath} esté completo.`);
    process.exit(1);
}

const dbPortInt = parseInt(dbConfig.port, 10);
if (isNaN(dbPortInt)) {
    console.error(`[DB] ERROR: El puerto de la base de datos "${dbConfig.port}" no es un número válido.`);
    process.exit(1);
}

const db = {};

const sequelizeInstance = new Sequelize(
    dbConfig.name,
    dbConfig.user,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbPortInt,
        dialect: dbConfig.dialect,
        dialectOptions: { charset: 'utf8mb4' },
        logging: env === 'development' ? console.log : false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    }
);

// --- Carga de Modelos ---
// Los modelos se adjuntarán a `sequelizeInstance.models` al ser importados
require('../api/models/user')(sequelizeInstance);
require('../api/models/objectives')(sequelizeInstance);
require('../api/models/progress')(sequelizeInstance);
require('../api/models/activityLog')(sequelizeInstance);

db.sequelize = sequelizeInstance;
db.Sequelize = Sequelize;

// Asigna los modelos al objeto `db` para fácil acceso
Object.assign(db, sequelizeInstance.models);

// --- Asociaciones de Modelos ---
// Ejecuta el método `associate` de cada modelo si existe
Object.values(sequelizeInstance.models)
    .filter(model => typeof model.associate === 'function')
    .forEach(model => model.associate(sequelizeInstance.models));

let isInitialized = false;

async function initializeDatabase() {
    if (isInitialized) {
        return;
    }
    try {
        console.log(`[DB] Autenticando con la base de datos '${dbConfig.name}'...`);
        await db.sequelize.authenticate();
        console.log(`[DB] Conexión a '${dbConfig.name}' establecida.`);

        // Lógica de sincronización controlada por variables de entorno
        const forceSync = process.env.DB_FORCE_SYNC === 'true';
        // 'alter' se activa si DB_ALTER_SYNC es true, o en desarrollo si no se está forzando.
        const alterSync = process.env.DB_ALTER_SYNC === 'true' || (env === 'development' && !forceSync);

        if (forceSync) {
            console.warn('[DB] Sincronizando base de datos con { force: true } - ¡SE PERDERÁN TODOS LOS DATOS!');
            await db.sequelize.sync({ force: true });
        } else if (alterSync) {
            console.log('[DB] Sincronizando base de datos con { alter: true }...');
            await db.sequelize.sync({ alter: true });
        } else {
            console.log('[DB] Sincronizando base de datos (sync estándar)...');
            await db.sequelize.sync();
        }
        
        isInitialized = true;
        console.log('[DB] Inicialización de base de datos completada.');

    } catch (error) {
        console.error(`[DB] Error de conexión/sincronización con la base de datos '${dbConfig.name}':`, error);
        throw error; // Relanzar para que el proceso principal lo maneje
    }
}

db.initializeDatabase = initializeDatabase;

module.exports = db;