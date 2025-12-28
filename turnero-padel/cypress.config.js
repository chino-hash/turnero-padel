const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      // Variables de entorno para pruebas
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'testpassword123',
      API_URL: 'http://localhost:3000/api',
    },
    setupNodeEvents(on, config) {
      // Implementar listeners de eventos de Node aquí
      on('task', {
        // Tareas personalizadas para pruebas
        log(message) {
          console.log(message);
          return null;
        },
        // Tarea para limpiar la base de datos de prueba
        clearDatabase() {
          // Implementar lógica de limpieza de BD
          return null;
        },
        // Tarea para sembrar datos de prueba
        seedDatabase() {
          // Implementar lógica de seeding
          return null;
        },
      });

      // Configurar variables de entorno basadas en el entorno
      if (config.env.NODE_ENV === 'test') {
        config.baseUrl = 'http://localhost:3001';
      }

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});