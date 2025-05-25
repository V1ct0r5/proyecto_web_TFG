// backend/src/config/database.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Necesitas bcryptjs para hashear la contraseña

const env = process.env.NODE_ENV || 'development';

let envPath;
if (env === 'test') {
    envPath = path.resolve(__dirname, '../../../.env.test');
} else {
    envPath = path.resolve(__dirname, '../../.env');
}
dotenv.config({ path: envPath });

console.log(`Cargando variables de entorno para ${env} desde ${envPath}`);

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
// Asegúrate que los nombres de archivo aquí ('user', 'objetivo', 'progress')
// coincidan con los nombres reales de tus archivos de modelos.
db.User = require('../api/models/user')(sequelizeInstance);
db.Objective = require('../api/models/objectives')(sequelizeInstance); // Asegúrate que el archivo se llama 'objetivo.js'
db.Progress = require('../api/models/progress')(sequelizeInstance);

db.sequelize = sequelizeInstance;
db.Sequelize = Sequelize;
db.DataTypes = DataTypes;

// --- Ejecutar asociaciones ---
Object.keys(db).forEach(modelName => {
    // Asegurarse de que el modelo tiene una función associate y no es una propiedad de Sequelize
    if (db[modelName] && typeof db[modelName].associate === 'function') {
        db[modelName].associate(db);
        console.log(`[DB] Asociaciones para el modelo ${modelName} inicializadas.`);
    }
});

let isInitialized = false;

async function initializeDatabase() {
    if (isInitialized) {
        console.log('[DB] Base de datos ya inicializada, saltando.');
        return db.sequelize;
    }
    try {
        console.log(`[DB] Intentando conectar a la base de datos '${dbName}'...`);
        await db.sequelize.authenticate();
        console.log(`[DB] Conexión a la base de datos '${dbName}' establecida con éxito.`);

        // --- Sincronización de modelos ---
        const forceSync = false; // MANTENER EN FALSE EN PRODUCCIÓN (borra toda la base de datos)
        const alterSync = true;  // Usar alter: true para añadir/modificar columnas sin perder datos

        if (alterSync) {
            await db.sequelize.sync({ alter: true });
        } else if (forceSync) {
            await db.sequelize.sync({ force: forceSync });
        } else {
             await db.sequelize.sync(); // O solo await db.sequelize.authenticate() si no quieres ningún sync
        }
        
        // La lógica del usuario de prueba debe ir *después* de que se sincronicen los modelos
        // y solo si forceSync es true (si has borrado la base de datos)
        if (forceSync) {            const existingUser = await db.User.findOne({ where: { correo_electronico: 'test@example.com' } });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(env.DB_PASSWORD, 10);
                await db.User.create({
                    nombre_usuario: 'usuario_prueba',
                    correo_electronico: 'test@example.com',
                    contrasena: hashedPassword
                });
            }
        }

        isInitialized = true;
        return db.sequelize;

    } catch (error) {
        console.error(`[DB] Error de conexión a la base de datos '${dbName}':`, error);
        throw error;
    }
}

db.initializeDatabase = initializeDatabase;

module.exports = db;