// ***********************************************************
// This example support/component.js is processed and
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
import { mount } from 'cypress/react18';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Example use:
// cy.mount(<MyComponent />)

// Configuración global para pruebas de componentes
import React from 'react';
import { SessionProvider } from 'next-auth/react';

// Mock de next-auth para pruebas de componentes
const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://via.placeholder.com/150',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Wrapper personalizado para componentes que necesitan contexto
Cypress.Commands.add('mountWithProviders', (component, options = {}) => {
  const { session = mockSession, ...mountOptions } = options;
  
  const Wrapper = ({ children }) => (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );

  return cy.mount(component, {
    ...mountOptions,
    wrapper: Wrapper,
  });
});

// Comando para montar componentes con props de prueba
Cypress.Commands.add('mountWithProps', (Component, props = {}) => {
  return cy.mount(<Component {...props} />);
});

// Configurar estilos globales para pruebas de componentes
import '../../../app/globals.css';

// Mock de next/router para componentes
const mockRouter = {
  push: cy.stub(),
  replace: cy.stub(),
  prefetch: cy.stub(),
  back: cy.stub(),
  forward: cy.stub(),
  refresh: cy.stub(),
  pathname: '/',
  query: {},
  asPath: '/',
};

// Configurar mocks globales para componentes
beforeEach(() => {
  // Mock de next/navigation
  cy.window().then((win) => {
    win.next = {
      router: mockRouter,
    };
  });
});

// Comando para verificar props de componente
Cypress.Commands.add('verifyProps', (selector, expectedProps) => {
  cy.get(selector).should(($el) => {
    const component = $el[0];
    Object.keys(expectedProps).forEach((prop) => {
      expect(component).to.have.property(prop, expectedProps[prop]);
    });
  });
});

// Comando para simular eventos de usuario en componentes
Cypress.Commands.add('userEvent', (selector, event, value) => {
  switch (event) {
    case 'type':
      cy.get(selector).clear().type(value);
      break;
    case 'click':
      cy.get(selector).click();
      break;
    case 'select':
      cy.get(selector).select(value);
      break;
    case 'check':
      cy.get(selector).check();
      break;
    case 'uncheck':
      cy.get(selector).uncheck();
      break;
    default:
      cy.get(selector).trigger(event, value);
  }
});

// Comando para verificar estados de componente
Cypress.Commands.add('verifyComponentState', (selector, state) => {
  cy.get(selector).should('have.class', `state-${state}`);
});