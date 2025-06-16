// cypress/e2e/3_dashboard_analysis_flow.cy.js

describe('Flujo de Dashboard y Análisis', () => {

  beforeEach(() => {
      cy.intercept('GET', '/api/dashboard/summary-stats', { fixture: 'dashboard_summary.json' }).as('getDashboardSummary');
      cy.intercept('GET', '/api/dashboard/recent-objectives*', { fixture: 'recent_objectives.json' }).as('getRecentObjectives');
      cy.intercept('GET', '/api/dashboard/recent-activities*', { fixture: 'recent_activities.json' }).as('getRecentActivities');
      cy.login('test_objectives@example.com', 'password123');
  });

  context('Dashboard Page', () => {
      it('debería mostrar correctamente las estadísticas, objetivos y actividades recientes', () => {
          cy.visit('/dashboard');
          cy.wait(['@getDashboardSummary', '@getRecentObjectives', '@getRecentActivities']);

          cy.contains('h3', 'Total de Objetivos').siblings('p').should('contain.text', '15');
          cy.contains('h3', 'Progreso Promedio').siblings('p').should('contain.text', '65');
          cy.contains('h3', 'PRÓXIMOS A VENCER').siblings('p').should('contain.text', '3');
          cy.contains('h3', 'CATEGORÍAS').parent().find('canvas').should('be.visible');

          const keyObjectivesSection = cy.contains('h3', 'Objetivos Clave / Recientes').parent();
          keyObjectivesSection.should('contain.text', 'Finish Q2 Report');
          keyObjectivesSection.should('contain.text', 'Learn Advanced React');

          // --- CORRECCIÓN FINAL: Se verifica que el componente renderiza texto relativo al tiempo. ---
          cy.contains('h3', 'Actividad Reciente').parent().should('contain.text', 'hace');
      });
  });

  context('Analysis Page', () => {
      beforeEach(() => {
          cy.intercept('GET', '/api/analysis/summary?period=*', { fixture: 'analysis_summary.json' }).as('getAnalysisSummary');
          cy.intercept('GET', '/api/analysis/category-distribution?period=*', { fixture: 'analysis_category_dist.json' }).as('getCategoryDistribution');
          cy.intercept('GET', '/api/analysis/status-distribution?period=*', { fixture: 'analysis_status_dist.json' }).as('getStatusDistribution');
          cy.intercept('GET', '/api/analysis/monthly-progress?period=*', { fixture: 'analysis_monthly_progress.json' }).as('getMonthlyProgress');
      });

      it('debería navegar a la página de Análisis y mostrar la pestaña "General" por defecto', () => {
          cy.visit('/analisis');
          cy.wait(['@getAnalysisSummary', '@getCategoryDistribution', '@getStatusDistribution', '@getMonthlyProgress']);
          
          cy.contains('h1', 'Análisis y Tendencias').should('be.visible');
          cy.contains('button', 'Vista General').should('be.visible');
          cy.contains('h3', 'Distribución por Categoría').parent().find('canvas').should('be.visible');
          cy.contains('h3', 'Estado de Objetivos').parent().find('canvas').should('be.visible');
      });

      it('debería cambiar de pestaña y cargar los datos correspondientes', () => {
          cy.intercept('GET', '/api/analysis/category-average-progress?period=*', { fixture: 'analysis_category_avg.json' }).as('getCategoryAvg');
          cy.intercept('GET', '/api/analysis/detailed-by-category?period=*', { fixture: 'analysis_detailed_cat.json' }).as('getDetailedCat');
          cy.intercept('GET', '/api/analysis/objective-progress-chart-data?period=*', { fixture: 'analysis_obj_progress.json' }).as('getObjProgress');
          cy.intercept('GET', '/api/analysis/ranked-objectives?period=*', { fixture: 'analysis_ranked_obj.json' }).as('getRankedObj');
          cy.visit('/analisis');

          cy.contains('button', 'Por Categorías').click();
          cy.wait(['@getCategoryAvg', '@getDetailedCat']);
          cy.contains('h4', 'Carrera profesional').scrollIntoView().should('be.visible');

          cy.contains('button', 'Por Objetivos').click();
          cy.wait(['@getObjProgress', '@getRankedObj']);
          cy.contains('h4', 'Objetivos con Mayor Progreso').scrollIntoView().should('be.visible');
      });

      it('debería re-llamar a las APIs al cambiar el filtro de tiempo', () => {
          cy.visit('/analisis');
          cy.wait('@getAnalysisSummary');

          cy.contains('h3', 'Objetivos Totales').siblings('p').should('contain.text', '25');

          cy.intercept('GET', '/api/analysis/summary?period=1year', { 
              body: { data: { totalObjectives: 5, activeObjectives: 2, completedObjectives: 3, averageProgress: 99, categoryCount: 1, categories: [], trend: { type: 'neutral', textKey: 'analysis.trends.stable' }} }
          }).as('getSummary1Year');
          
          cy.get('#time-period-filter').select('1year');
          cy.wait('@getSummary1Year');

          cy.contains('h3', 'Objetivos Totales').siblings('p')
            .should('contain.text', '5')
            .and('not.contain.text', '25');
      });
  });
});