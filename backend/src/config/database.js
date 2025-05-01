const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

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

async function initializeDatabase() {
    if (db.sequelize) {
        return db.sequelize;
    }
    try {
        console.log(`[DB] Intentando conectar a la base de datos '${dbName}'...`);
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

        await sequelizeInstance.authenticate();
        console.log(`[DB] Conexión a la base de datos '${dbName}' establecida con éxito.`);

        db.sequelize = sequelizeInstance;
        db.Sequelize = Sequelize;
        db.DataTypes = DataTypes;

        db.User = require('../api/models/user')(sequelizeInstance, DataTypes);
        db.Objective = require('../api/models/objectives')(sequelizeInstance, DataTypes);

        db.User.hasMany(db.Objective, { foreignKey: 'id_usuario' });
        db.Objective.belongsTo(db.User, { foreignKey: 'id_usuario' });
        console.log('Asociaciones de modelos definidas.');


        if (env !== 'production') {
           await db.sequelize.sync({ force: env === 'test' });
           console.log('Modelos sincronizados con la base de datos.');
        }

        return db.sequelize;

    } catch (error) {
        console.error(`[DB] Error de conexión a la base de datos '${dbName}':`, error);
        throw error;
    }
}

db.initializeDatabase = initializeDatabase;
db.Sequelize = Sequelize;


module.exports = db;