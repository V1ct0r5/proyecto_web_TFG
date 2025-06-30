// ruta: cypress/e2e/1_auth_flow.cy.js

describe('Flujo de Autenticación', () => {

  it('debería registrar un usuario y redirigir al dashboard', () => {
    cy.intercept('POST', '/api/auth/register').as('registerRequest');

    
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');
    const username = `cypress_user_${Date.now()}`;

    cy.visit('/register');

    // --- CORRECCIÓN: Se usa el selector 'name' que existe en tu formulario ---
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
    cy.url().should('include', '/dashboard');
    
    // Verificamos que el saludo en la cabecera contiene el nombre de usuario
    cy.get('header').should('contain.text', username);
  });

  it('debería fallar el login con credenciales incorrectas', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    
    cy.visit('/login');

    // --- CORRECCIÓN: Se usa el selector 'name' ---
    cy.get('input[name="email"]').type('usuario.inexistente@test.com');
    cy.get('input[name="password"]').type('password-incorrecta');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
    cy.url().should('include', '/login');
    
    // Verificamos que aparece el mensaje de error de credenciales incorrectas
    // (Asegúrate de que la clave de traducción 'loginForm.errors.incorrectCredentials' 
    // se traduce como 'Credenciales incorrectas.')
    cy.contains('Credenciales incorrectas').should('be.visible');
  });

  it('debería mostrar un error de validación del frontend si las contraseñas no coinciden', () => {
    cy.visit('/register');
    
    // --- CORRECCIÓN: Se usa el selector 'name' ---
    cy.get('input[name="username"]').type('test_user_mismatch');
    cy.get('input[name="email"]').type('mismatch@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password_diferente');
    
    // Forzamos que se muestre el error haciendo clic fuera del campo
    cy.get('body').click(); 

    // Verificamos que el mensaje de error del frontend es visible
    // (Asegúrate de que 'formValidation.passwordsDoNotMatch' se traduce como 'Las contraseñas no coinciden')
    cy.contains('Las contraseñas no coinciden').should('be.visible');
  });
});