// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configuración global para Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar errores específicos que no afectan las pruebas
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  // Permitir que otros errores fallen las pruebas
  return true;
});

// Configurar viewport por defecto
beforeEach(() => {
  cy.viewport(1280, 720);
});

// Limpiar cookies y localStorage antes de cada test
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearSessionStorage();
});

// Configurar interceptores comunes
beforeEach(() => {
  // Interceptar llamadas a APIs externas si es necesario
  cy.intercept('GET', '/api/auth/session', { fixture: 'auth/session.json' }).as('getSession');
});

// Comandos de utilidad global
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Comando para login de prueba
Cypress.Commands.add('loginAsTestUser', () => {
  cy.session('testUser', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Comando para limpiar base de datos
Cypress.Commands.add('clearDatabase', () => {
  cy.task('clearDatabase');
});

// Comando para sembrar datos de prueba
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase');
});