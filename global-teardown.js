const { sequelize } = require('./backend/src/config/database');

module.exports = async () => {
  console.log('\n[Global Teardown] Cerrando conexión de Sequelize...');
  // Cierra la conexión del pool de Sequelize
  await sequelize.close();
  console.log('[Global Teardown] Conexión de Sequelize cerrada.');
};