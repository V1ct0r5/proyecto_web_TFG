// cypress/e2e/2_objectives_flow.cy.js

describe('Flujo de Gestión de Objetivos', () => {

  before(() => {
    // Se crea un usuario único para cada ejecución del test para evitar conflictos
    const testUser = {
      username: `test_obj_user_${Date.now()}`,
      email: Cypress.env('TEST_USER_EMAIL'), // Usa la variable de entorno
            password: Cypress.env('TEST_USER_PASSWORD'), // Usa la variable de entorno
            confirmPassword: Cypress.env('TEST_USER_PASSWORD')
    };
    cy.request({
      method: 'POST',
      url: 'http://localhost:3001/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    });
  });

  beforeEach(() => {
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

  it('debería crear, editar y eliminar un objetivo correctamente', () => {
    const objectiveTitle = `Mi Objetivo E2E - ${Date.now()}`;
    const updatedTitle = `Mi Objetivo E2E Actualizado - ${Date.now()}`;
    let objectiveId;

    // --- 1. CREAR OBJETIVO ---
    cy.intercept('POST', '/api/objectives').as('createObjective');
    cy.visit('/objectives');
    
    // Rellenamos el formulario (asumiendo que esta parte ya funciona)
    cy.get('input[name="name"]').type(objectiveTitle);
    cy.get('textarea[name="description"]').type('Descripción del objetivo E2E.');
    cy.get('select[name="category"]').select('CAREER');
    cy.get('input[name="targetValue"]').type('100');
    cy.get('input[name="initialValue"]').type('0');
    cy.get('.date-display-input').last().click();
    cy.get('.react-calendar__tile').not('.react-calendar__month-view__days__day--neighboringMonth').contains('28').click();
    cy.get('button[type="submit"]').click();

    cy.wait('@createObjective').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      objectiveId = interception.response.body.data.objective.id;
      
      cy.url().should('include', '/dashboard');

      // --- 2. EDITAR OBJETIVO (DENTRO DEL .then()) ---
      cy.visit('/mis-objetivos');
      cy.contains('article', objectiveTitle).contains('button', 'Editar').click();
      cy.url().should('include', `/objectives/edit/${objectiveId}`);
      cy.intercept('PUT', `/api/objectives/${objectiveId}`).as('updateObjective');
      cy.get('input[name="name"]').clear().type(updatedTitle);
      cy.get('button[type="submit"]').click();

      return cy.wait('@updateObjective');

    }).then((updateInterception) => {
      expect(updateInterception.response.statusCode).to.eq(200);
      const objectiveId = updateInterception.response.body.data.objective.id;

      cy.url().should('include', '/mis-objetivos');
      cy.contains(updatedTitle).should('be.visible');

      // --- 3. ELIMINAR OBJETIVO (DENTRO DEL .then() anidado) ---
      cy.intercept('DELETE', `/api/objectives/${objectiveId}`).as('deleteObjective');
      
      // CORRECCIÓN: El flujo correcto para eliminar es ir a Detalles y luego hacer clic en Eliminar.
      // Paso 3.1: Ir a la página de detalles del objetivo
      cy.contains('article', updatedTitle).contains('button', 'Detalles').click();
      cy.url().should('include', `/objectives/${objectiveId}`);
      
      // Paso 3.2: Ahora que estamos en la página de detalles, hacer clic en el botón Eliminar
      cy.contains('button', 'Eliminar').click();

      // Cypress acepta el window.confirm por defecto, así que no se necesita un paso extra para ello.
      
      cy.wait('@deleteObjective').its('response.statusCode').should('eq', 204);
      
      // Verificamos que se nos redirige a la lista y el objetivo ya no existe
      cy.url().should('include', '/mis-objetivos');
      cy.contains(updatedTitle).should('not.exist');
    });
  });
});
