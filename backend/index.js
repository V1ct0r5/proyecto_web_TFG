const app = require('./app');  // Importamos la configuración de la app
const PORT = 3000; // Define el puerto
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});