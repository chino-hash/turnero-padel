// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando para login con Google (simulado)
Cypress.Commands.add('loginWithGoogle', () => {
  cy.intercept('POST', '/api/auth/callback/google', {
    statusCode: 200,
    body: {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://via.placeholder.com/150',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }).as('googleLogin');

  cy.get('[data-testid="google-login-button"]').click();
  cy.wait('@googleLogin');
});

// Comando para crear una reserva de prueba
Cypress.Commands.add('createTestBooking', (bookingData = {}) => {
  const defaultBooking = {
    courtId: 1,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    players: 4,
    ...bookingData,
  };

  cy.intercept('POST', '/api/bookings', {
    statusCode: 201,
    body: {
      id: Math.floor(Math.random() * 1000),
      ...defaultBooking,
      status: 'confirmed',
      totalPrice: 2000,
    },
  }).as('createBooking');

  return cy.wrap(defaultBooking);
});

// Comando para navegar a una página y esperar que cargue
Cypress.Commands.add('visitAndWait', (url) => {
  cy.visit(url);
  cy.waitForPageLoad();
});

// Comando para llenar formulario de reserva
Cypress.Commands.add('fillBookingForm', (bookingData) => {
  if (bookingData.court) {
    cy.get('[data-testid="court-select"]').select(bookingData.court);
  }
  if (bookingData.date) {
    cy.get('[data-testid="date-picker"]').type(bookingData.date);
  }
  if (bookingData.startTime) {
    cy.get('[data-testid="start-time-select"]').select(bookingData.startTime);
  }
  if (bookingData.endTime) {
    cy.get('[data-testid="end-time-select"]').select(bookingData.endTime);
  }
  if (bookingData.players) {
    cy.get('[data-testid="players-input"]').clear().type(bookingData.players.toString());
  }
});

// Comando para verificar elementos de accesibilidad
Cypress.Commands.add('checkA11y', (selector) => {
  if (selector) {
    cy.get(selector).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  } else {
    cy.get('button, input, select, textarea').each(($el) => {
      cy.wrap($el).should('satisfy', (el) => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') || 
               el.hasAttribute('title') ||
               el.textContent.trim() !== '';
      });
    });
  }
});

// Comando para esperar y hacer clic en un elemento
Cypress.Commands.add('waitAndClick', (selector, options = {}) => {
  cy.get(selector, options).should('be.visible').and('not.be.disabled').click();
});

// Comando para verificar notificaciones/toasts
Cypress.Commands.add('verifyToast', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`)
    .should('be.visible')
    .and('contain.text', message);
});

// Comando para simular errores de red
Cypress.Commands.add('simulateNetworkError', (url) => {
  cy.intercept('**/api/**', { forceNetworkError: true }).as('networkError');
});

// Comando para verificar elementos de carga
Cypress.Commands.add('verifyLoadingState', (selector = '[data-testid="loading"]') => {
  cy.get(selector).should('be.visible');
  cy.get(selector).should('not.exist');
});

// Comando para tomar screenshot con nombre personalizado
Cypress.Commands.add('takeScreenshot', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Comando para verificar responsive design
Cypress.Commands.add('checkResponsive', () => {
  const viewports = [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1280, height: 720 }, // Desktop
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('body').should('be.visible');
    cy.wait(500); // Esperar a que se ajuste el layout
  });
});

// Comando para verificar performance básica
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    expect(loadTime).to.be.lessThan(5000); // Menos de 5 segundos
  });
});