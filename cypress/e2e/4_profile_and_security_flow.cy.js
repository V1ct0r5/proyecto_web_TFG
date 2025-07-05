// --- ARCHIVO CORREGIDO: 4_profile_and_security_flow.cy.js ---

describe('Flujos de Perfil, Configuración y Seguridad', () => {

    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        username: 'profile_tester'
    };

    before(() => {
        cy.task('cleanDatabase'); 
        cy.task('resetTestUser', testUser.email).then(() => {
            cy.registerUser(testUser);
        });
    });

    beforeEach(() => {
            cy.login(testUser.email, testUser.password);
        cy.intercept('GET', '/api/profile', { fixture: 'profile_user.json' }).as('getProfile');
        cy.intercept('GET', '/api/profile/stats', { fixture: 'profile_stats.json' }).as('getStats');
        cy.intercept('GET', '/api/settings', { fixture: 'settings.json' }).as('getSettings');
    });

    context('Gestión del Perfil de Usuario', () => {
        it('debería permitir a un usuario ver y actualizar su nombre de usuario', () => {
            cy.visit('/profile');
            cy.wait(['@getProfile', '@getStats']);

            cy.contains('button', 'Editar Perfil').click();

            const newUsername = 'UsuarioActualizado';
            cy.get('input[name="name"]').clear().type(newUsername);

            cy.intercept('PATCH', '/api/profile', { fixture: 'profile_update_success.json' }).as('updateProfile');
            cy.get('form#profile-form').submit();

            cy.wait('@updateProfile');
            cy.contains('Perfil actualizado con éxito!').should('be.visible');
            cy.get('header').contains(newUsername).should('be.visible');
        });
    });

    context('Gestión de la Configuración y Seguridad', () => {
        it('debería permitir a un usuario cambiar su contraseña correctamente', () => {
            cy.visit('/settings');
            cy.wait('@getSettings');

            const currentPassword = testUser.password; // Usar la contraseña del usuario de prueba
            const newPassword = `newPassword_${Date.now()}`;

            cy.intercept('PUT', '/api/settings/change-password', { statusCode: 200, body: { message: 'Password updated successfully' } }).as('changePassword');

            cy.get('input[name="currentPassword"]').type(currentPassword);
            cy.get('input[name="newPassword"]').type(newPassword);
            cy.get('input[name="confirmNewPassword"]').type(newPassword);

            cy.get('input[name="currentPassword"]').closest('form').submit();

            cy.wait('@changePassword');
            cy.contains('Contraseña actualizada con éxito.').should('be.visible');
        });

        it('debería permitir a un usuario cambiar el idioma y verificar que persiste', () => {
            cy.visit('/settings');
            cy.wait('@getSettings');

            cy.contains('h1', 'Configuración de la Cuenta').should('be.visible');

            cy.get('select[name="language"]').select('en');

            // --- CORRECCIÓN SUGERIDA: Usar un selector más robusto si el texto cambia con el idioma ---
            // En este caso, el texto "Save Changes" podría no existir si el idioma actual es español.
            // Para este test, asumimos que inicialmente está en español y el botón dirá "Guardar Cambios".
            const saveButton = cy.contains('button', 'Guardar Cambios');
            saveButton.scrollIntoView().should('be.visible');

            cy.intercept('PUT', '/api/settings', { statusCode: 200 }).as('saveSettings');
            saveButton.click();

            // Después de guardar, la página puede recargarse y el toast puede estar en inglés.
            cy.wait('@saveSettings');
            cy.contains('Settings saved successfully').should('be.visible');

            cy.intercept('GET', '/api/settings', {
                body: { data: { language: 'en', themePreference: 'dark', dateFormat: 'dd/MM/yyyy' } }
            }).as('getEnglishSettings');

            cy.reload();
            cy.wait('@getEnglishSettings');
        });

        it('NO debería permitir que un usuario vea un objetivo de otro usuario', () => {
            const otroUsuarioObjetivoId = 999;

            cy.intercept('GET', `/api/objectives/${otroUsuarioObjetivoId}`, { statusCode: 404, body: { message: 'Objective not found' } }).as('getObjective');

            cy.visit(`/objectives/${otroUsuarioObjetivoId}`, { failOnStatusCode: false });

            cy.wait('@getObjective');

            cy.contains('button', 'Actualizar Progreso').should('not.exist');
        });
    });
});