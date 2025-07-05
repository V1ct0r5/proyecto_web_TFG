// cypress/e2e/2_objectives_flow.cy.js

describe('Flujo Completo de Gestión de Objetivos', () => {
    const testUser = {
      username: `flow_user_${Date.now()}`,
      email: `flow.user.${Date.now()}@example.com`,
      password: 'aVerySecureTestPassword123'
    };
  
    before(() => {
      cy.task('cleanDatabase'); 
      cy.registerUser(testUser);
      cy.wrap(testUser).as('testUser');
    });
  
    beforeEach(() => {
      cy.intercept('POST', '/api/objectives').as('createObjective');
      cy.intercept('PUT', '/api/objectives/*').as('updateObjective');
      cy.intercept('DELETE', '/api/objectives/*').as('deleteObjective');
      cy.intercept('PATCH', '/api/objectives/*/unarchive').as('unarchiveObjective');
      cy.intercept('GET', '/api/dashboard/summary-stats').as('getDashboardSummary');
      cy.intercept('GET', '/api/dashboard/recent-objectives*').as('getRecentObjectives');
      cy.intercept('GET', '/api/objectives*').as('getObjectives');
    });
  
    it('debería gestionar el ciclo de vida completo de un objetivo', () => {
      const objectiveTitle = `Mi Objetivo de Prueba Cypress ${Date.now()}`;
      const updatedObjectiveTitle = `Mi Objetivo Actualizado por Cypress ${Date.now()}`;
      let objectiveId;
  
      cy.get('@testUser').then(user => {
        cy.login(user.email, user.password);
      });
  
      cy.visit('/dashboard');
      cy.wait('@getDashboardSummary');
      cy.url().should('include', '/objectives/new');
      
      cy.get('h2').should('be.visible').and('contain.text', 'Crea Tu Primer Objetivo');
      
      cy.get('[data-cy="objective-name-input"]').type(objectiveTitle);
      cy.get('[data-cy="objective-category-select"]').select('PERSONAL_DEV', { force: true });
      cy.get('[data-cy="objective-initial-value-input"]').type('10');
      cy.get('[data-cy="objective-target-value-input"]').type('100');
      
      cy.get('[data-cy="objective-submit-button"]').click();
  
      cy.wait('@createObjective').then((interception) => {
        expect(interception.response.statusCode).to.eq(201);
        objectiveId = interception.response.body.data.objective.id;
          
        cy.url().should('include', '/dashboard');
        cy.wait('@getRecentObjectives');
        cy.get('[class*="RecentObjectivesList_listContainer"]').should('contain', objectiveTitle);
  
      }).then(() => {
        cy.visit(`/objectives/edit/${objectiveId}`);
        
        cy.get('[data-cy="objective-name-input"]').should('have.value', objectiveTitle);
        cy.get('[data-cy="objective-name-input"]').clear().type(updatedObjectiveTitle);
        cy.get('[data-cy="objective-submit-button"]').click();
        
        return cy.wait('@updateObjective');
      
      }).then((updateInterception) => {
          expect(updateInterception.response.statusCode).to.eq(200);
          
          // --- EL BLOQUE CORREGIDO ---
          // 1. La app nos ha navegado a "/mis-objetivos" (o una URL similar). Verificamos estar ahí.
          cy.url().should('match', /\/my-objectives|\/mis-objetivos/);
          
          // 2. Esperamos a que la página de la lista de objetivos cargue sus datos.
          cy.wait('@getObjectives');
    
          // 3. Verificamos que nuestro objetivo actualizado está visible.
          cy.contains(`[data-cy="objetivo-card-${objectiveId}"]`, updatedObjectiveTitle).should('be.visible');
          
          // --- EL RESTO DEL TEST CONTINÚA ---
          cy.get(`[data-cy="objetivo-card-${objectiveId}"] [data-cy="archive-button"]`).click();
          cy.on('window:confirm', () => true);
          cy.wait('@updateObjective');
  
          cy.get(`[data-cy="objetivo-card-${objectiveId}"]`).should('not.exist');
  
          cy.get('[data-cy="include-archived-checkbox"]').check();
          cy.wait('@getObjectives');
          cy.contains(`[data-cy="objetivo-card-${objectiveId}"]`, updatedObjectiveTitle).should('be.visible');
  
          cy.get(`[data-cy="objetivo-card-${objectiveId}"] [data-cy="unarchive-button"]`).click();
          cy.on('window:confirm', () => true);
          cy.wait('@unarchiveObjective');
          
          cy.get('[data-cy="include-archived-checkbox"]').should('not.be.checked');
          cy.wait('@getObjectives');
          cy.contains(`[data-cy="objetivo-card-${objectiveId}"]`, updatedObjectiveTitle).should('be.visible');
          
          cy.get(`[data-cy="objetivo-card-${objectiveId}"]`).click();
          cy.url().should('include', `/objectives/${objectiveId}`);
  
          cy.get('[data-cy="delete-objective-button"]').click();
          cy.on('window:confirm', () => true);
  
          cy.wait('@deleteObjective').its('response.statusCode').should('eq', 204);
          cy.url().should('include', '/my-objectives');
          cy.wait('@getObjectives');
          cy.contains(updatedObjectiveTitle).should('not.exist');
      });
    });
  });