
/**
 * Comando para registrar un nuevo usuario a través de la API.
 * Útil para la configuración de tests (before hooks).
 * @param {object} user - Un objeto con { username, email, password }
 */
Cypress.Commands.add('registerUser', (user) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3001/api/auth/register', // URL completa de la API
    body: {
      username: user.username,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    },
  });
});

/**
 * Comando para iniciar sesión programáticamente obteniendo un token de la API.
 * Este método es más robusto que usar cy.session para este caso de uso.
 * El token se almacena en una variable de entorno de Cypress.
 * @param {string} email - El correo del usuario a loguear.
 * @param {string} password - La contraseña del usuario.
 */
// VERSIÓN CORREGIDA Y ROBUSTA
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3001/api/auth/login',
    body: {
      email,
      password,
    },
  }).then(({ body }) => {
    // La clave es que esta acción ahora ocurre dentro del .then()
    // del comando cy.request, que es esperado por Cypress.
    window.localStorage.setItem('token', body.token);
    // Opcional pero recomendado: guardar el objeto user también.
    window.localStorage.setItem('user', JSON.stringify(body.user));
  });
});

/**
 * Comando personalizado para visitar una página con el token de autenticación.
 * Centraliza la lógica de inyección del token en localStorage.
 * @param {string} url - La URL a visitar.
 */
Cypress.Commands.add('visitWithAuth', (url) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      // Inyectamos el token en el localStorage del navegador
      // ANTES de que cualquier script de la aplicación se ejecute.
      win.localStorage.setItem('token', Cypress.env('authToken'));
    },
  });
});