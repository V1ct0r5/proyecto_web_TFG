describe('Flujo de Autenticación', () => {
  const testUser = {
    username: `test_auth_user_${Date.now()}`,
    email: `auth_user_${Date.now()}@example.com`,
    password: 'aVerySecureTestPassword123'
  };

  before(() => {
    cy.task('cleanDatabase'); 
    cy.task('resetTestUser', testUser.email);
  });

  it('debería registrar un usuario y redirigir al dashboard', () => {
    cy.intercept('POST', '/api/auth/register').as('registerRequest');
    
    cy.visit('/register');

    cy.get('input[name="username"]').type(testUser.username);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
    cy.url().should('include', '/dashboard');
    cy.get('header').should('contain.text', testUser.username);
  });

  it('debería fallar el login con credenciales incorrectas', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    
    cy.visit('/login');

    cy.get('input[name="email"]').type('usuario.inexistente@test.com');
    cy.get('input[name="password"]').type('password-incorrecta');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
    cy.url().should('include', '/login');
    cy.contains('Credenciales incorrectas').should('be.visible');
  });

  it('debería mostrar un error de validación del frontend si las contraseñas no coinciden', () => {
    cy.visit('/register');
    
    cy.get('input[name="username"]').type('test_user_mismatch');
    cy.get('input[name="email"]').type('mismatch@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password_diferente');
    
    cy.get('body').click(); 

    cy.contains('Las contraseñas no coinciden').should('be.visible');
  });
});