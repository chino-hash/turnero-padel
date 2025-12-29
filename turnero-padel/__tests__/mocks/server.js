// Configuración simplificada para pruebas
// MSW se configurará más adelante cuando sea necesario

// Mock de fetch global para pruebas
const mockFetch = (mockResponse) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })
  );
};

// Utilidades para pruebas
const mockApiError = (status = 500, message = 'Internal Server Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
      text: () => Promise.resolve(JSON.stringify({ error: message })),
    })
  );
};

const mockApiSuccess = (data, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  );
};

const mockApiDelay = (data, delay = 1000) => {
  global.fetch = jest.fn(() =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }, delay);
    })
  );
};

// Reset para limpiar todos los mocks
const resetMocks = () => {
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
  jest.clearAllMocks();
};

// Configuración global para pruebas
beforeEach(() => {
  // Limpiar mocks antes de cada prueba
  resetMocks();
});

module.exports = {
  mockFetch,
  mockApiError,
  mockApiSuccess,
  mockApiDelay,
  resetMocks
};