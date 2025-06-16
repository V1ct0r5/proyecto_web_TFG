
/**
 * Comando personalizado para iniciar sesión en la aplicación.
 * @param {string} email - El correo electrónico del usuario.
 * @param {string} password - La contraseña del usuario.
 */
Cypress.Commands.add('login', (email, password) => {
  // Usar cy.session para mantener la sesión y acelerar los tests
  cy.session([email, password], () => {
    cy.visit('/login');
    
    // --- CORRECCIÓN: Se usa el selector 'name' que existe en tu formulario ---
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password, { log: false });
    cy.get('button[type="submit"]').click();

    // La verificación robusta es que la URL cambie al dashboard.
    // Se elimina la dependencia del texto del título.
    cy.url().should('include', '/dashboard');
  });
});